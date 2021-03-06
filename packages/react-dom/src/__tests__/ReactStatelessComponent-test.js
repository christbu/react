/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @emails react-core
 */

'use strict';

var PropTypes;
var React;
var ReactDOM;
var ReactTestUtils;

function StatelessComponent(props) {
  return <div>{props.name}</div>;
}

describe('ReactStatelessComponent', () => {
  function normalizeCodeLocInfo(str) {
    return str && str.replace(/\(at .+?:\d+\)/g, '(at **)');
  }

  beforeEach(() => {
    jest.resetModuleRegistry();
    PropTypes = require('prop-types');
    React = require('react');
    ReactDOM = require('react-dom');
    ReactTestUtils = require('react-dom/test-utils');
  });

  it('should render stateless component', () => {
    var el = document.createElement('div');
    ReactDOM.render(<StatelessComponent name="A" />, el);

    expect(el.textContent).toBe('A');
  });

  it('should update stateless component', () => {
    class Parent extends React.Component {
      render() {
        return <StatelessComponent {...this.props} />;
      }
    }

    var el = document.createElement('div');
    ReactDOM.render(<Parent name="A" />, el);
    expect(el.textContent).toBe('A');

    ReactDOM.render(<Parent name="B" />, el);
    expect(el.textContent).toBe('B');
  });

  it('should unmount stateless component', () => {
    var container = document.createElement('div');

    ReactDOM.render(<StatelessComponent name="A" />, container);
    expect(container.textContent).toBe('A');

    ReactDOM.unmountComponentAtNode(container);
    expect(container.textContent).toBe('');
  });

  it('should pass context thru stateless component', () => {
    class Child extends React.Component {
      static contextTypes = {
        test: PropTypes.string.isRequired,
      };

      render() {
        return <div>{this.context.test}</div>;
      }
    }

    function Parent() {
      return <Child />;
    }

    class GrandParent extends React.Component {
      static childContextTypes = {
        test: PropTypes.string.isRequired,
      };

      getChildContext() {
        return {test: this.props.test};
      }

      render() {
        return <Parent />;
      }
    }

    var el = document.createElement('div');
    ReactDOM.render(<GrandParent test="test" />, el);

    expect(el.textContent).toBe('test');

    ReactDOM.render(<GrandParent test="mest" />, el);

    expect(el.textContent).toBe('mest');
  });

  it('should warn for childContextTypes on a functional component', () => {
    spyOn(console, 'error');
    function StatelessComponentWithChildContext(props) {
      return <div>{props.name}</div>;
    }

    StatelessComponentWithChildContext.childContextTypes = {
      foo: PropTypes.string,
    };

    var container = document.createElement('div');

    ReactDOM.render(<StatelessComponentWithChildContext name="A" />, container);

    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'StatelessComponentWithChildContext(...): childContextTypes cannot ' +
        'be defined on a functional component.',
    );
  });

  it('should throw when stateless component returns undefined', () => {
    function NotAComponent() {}
    expect(function() {
      ReactTestUtils.renderIntoDocument(
        <div>
          <NotAComponent />
        </div>,
      );
    }).toThrowError(
      'NotAComponent(...): Nothing was returned from render. ' +
        'This usually means a return statement is missing. Or, to render nothing, return null.',
    );
  });

  it('should throw on string refs in pure functions', () => {
    function Child() {
      return <div ref="me" />;
    }

    expect(function() {
      ReactTestUtils.renderIntoDocument(<Child test="test" />);
    }).toThrowError('Stateless function components cannot have refs.');
  });

  it('should warn when given a string ref', () => {
    spyOn(console, 'error');

    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    class ParentUsingStringRef extends React.Component {
      render() {
        return (
          <Indirection>
            <StatelessComponent name="A" ref="stateless" />
          </Indirection>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<ParentUsingStringRef />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. ' +
        'Attempts to access this ref will fail.\n\nCheck the render method ' +
        'of `ParentUsingStringRef`.\n' +
        '    in StatelessComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Indirection (at **)\n' +
        '    in ParentUsingStringRef (at **)',
    );

    ReactTestUtils.renderIntoDocument(<ParentUsingStringRef />);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('should warn when given a function ref', () => {
    spyOn(console, 'error');

    function Indirection(props) {
      return <div>{props.children}</div>;
    }

    class ParentUsingFunctionRef extends React.Component {
      render() {
        return (
          <Indirection>
            <StatelessComponent
              name="A"
              ref={arg => {
                expect(arg).toBe(null);
              }}
            />
          </Indirection>
        );
      }
    }

    ReactTestUtils.renderIntoDocument(<ParentUsingFunctionRef />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. ' +
        'Attempts to access this ref will fail.\n\nCheck the render method ' +
        'of `ParentUsingFunctionRef`.\n' +
        '    in StatelessComponent (at **)\n' +
        '    in div (at **)\n' +
        '    in Indirection (at **)\n' +
        '    in ParentUsingFunctionRef (at **)',
    );

    ReactTestUtils.renderIntoDocument(<ParentUsingFunctionRef />);
    expectDev(console.error.calls.count()).toBe(1);
  });

  it('deduplicates ref warnings based on element or owner', () => {
    spyOn(console, 'error');

    // When owner uses JSX, we can use exact line location to dedupe warnings
    class AnonymousParentUsingJSX extends React.Component {
      render() {
        return <StatelessComponent name="A" ref={() => {}} />;
      }
    }
    Object.defineProperty(AnonymousParentUsingJSX, 'name', {value: undefined});

    const instance1 = ReactTestUtils.renderIntoDocument(
      <AnonymousParentUsingJSX />,
    );
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.',
    );
    // Should be deduped (offending element is on the same line):
    instance1.forceUpdate();
    // Should also be deduped (offending element is on the same line):
    ReactTestUtils.renderIntoDocument(<AnonymousParentUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    console.error.calls.reset();

    // When owner doesn't use JSX, and is anonymous, we warn once per internal instance.
    class AnonymousParentNotUsingJSX extends React.Component {
      render() {
        return React.createElement(StatelessComponent, {
          name: 'A',
          ref: () => {},
        });
      }
    }
    Object.defineProperty(AnonymousParentNotUsingJSX, 'name', {
      value: undefined,
    });

    const instance2 = ReactTestUtils.renderIntoDocument(
      <AnonymousParentNotUsingJSX />,
    );
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.',
    );
    // Should be deduped (same internal instance):
    instance2.forceUpdate();
    expectDev(console.error.calls.count()).toBe(1);
    // Could not be deduped (different internal instance):
    ReactTestUtils.renderIntoDocument(<AnonymousParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(2);
    expectDev(console.error.calls.argsFor(1)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.',
    );
    console.error.calls.reset();

    // When owner doesn't use JSX, but is named, we warn once per owner name
    class NamedParentNotUsingJSX extends React.Component {
      render() {
        return React.createElement(StatelessComponent, {
          name: 'A',
          ref: () => {},
        });
      }
    }
    const instance3 = ReactTestUtils.renderIntoDocument(
      <NamedParentNotUsingJSX />,
    );
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'Warning: Stateless function components cannot be given refs.',
    );
    // Should be deduped (same owner name):
    instance3.forceUpdate();
    expectDev(console.error.calls.count()).toBe(1);
    // Should also be deduped (same owner name):
    ReactTestUtils.renderIntoDocument(<NamedParentNotUsingJSX />);
    expectDev(console.error.calls.count()).toBe(1);
    console.error.calls.reset();
  });

  // This guards against a regression caused by clearing the current debug fiber.
  // https://github.com/facebook/react/issues/10831
  it('should warn when giving a function ref with context', () => {
    spyOn(console, 'error');

    function Child() {
      return null;
    }
    Child.contextTypes = {
      foo: PropTypes.string,
    };

    class Parent extends React.Component {
      static childContextTypes = {
        foo: PropTypes.string,
      };
      getChildContext() {
        return {
          foo: 'bar',
        };
      }
      render() {
        return <Child ref={function() {}} />;
      }
    }

    ReactTestUtils.renderIntoDocument(<Parent />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(normalizeCodeLocInfo(console.error.calls.argsFor(0)[0])).toBe(
      'Warning: Stateless function components cannot be given refs. ' +
        'Attempts to access this ref will fail.\n\nCheck the render method ' +
        'of `Parent`.\n' +
        '    in Child (at **)\n' +
        '    in Parent (at **)',
    );
  });

  it('should provide a null ref', () => {
    function Child() {
      return <div />;
    }

    var comp = ReactTestUtils.renderIntoDocument(<Child />);
    expect(comp).toBe(null);
  });

  it('should use correct name in key warning', () => {
    function Child() {
      return <div>{[<span />]}</div>;
    }

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expectDev(console.error.calls.count()).toBe(1);
    expectDev(console.error.calls.argsFor(0)[0]).toContain(
      'a unique "key" prop',
    );
    expectDev(console.error.calls.argsFor(0)[0]).toContain('Child');
  });

  it('should support default props and prop types', () => {
    function Child(props) {
      return <div>{props.test}</div>;
    }
    Child.defaultProps = {test: 2};
    Child.propTypes = {test: PropTypes.string};

    spyOn(console, 'error');
    ReactTestUtils.renderIntoDocument(<Child />);
    expectDev(console.error.calls.count()).toBe(1);
    expect(
      console.error.calls.argsFor(0)[0].replace(/\(at .+?:\d+\)/g, '(at **)'),
    ).toBe(
      'Warning: Failed prop type: Invalid prop `test` of type `number` ' +
        'supplied to `Child`, expected `string`.\n' +
        '    in Child (at **)',
    );
  });

  it('should receive context', () => {
    class Parent extends React.Component {
      static childContextTypes = {
        lang: PropTypes.string,
      };

      getChildContext() {
        return {lang: 'en'};
      }

      render() {
        return <Child />;
      }
    }

    function Child(props, context) {
      return <div>{context.lang}</div>;
    }
    Child.contextTypes = {lang: PropTypes.string};

    var el = document.createElement('div');
    ReactDOM.render(<Parent />, el);
    expect(el.textContent).toBe('en');
  });

  it('should work with arrow functions', () => {
    var Child = function() {
      return <div />;
    };
    // Will create a new bound function without a prototype, much like a native
    // arrow function.
    Child = Child.bind(this);

    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });

  it('should allow simple functions to return null', () => {
    var Child = function() {
      return null;
    };
    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });

  it('should allow simple functions to return false', () => {
    function Child() {
      return false;
    }
    expect(() => ReactTestUtils.renderIntoDocument(<Child />)).not.toThrow();
  });
});
