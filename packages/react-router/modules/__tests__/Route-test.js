import expect from 'expect'
import React from 'react'
import ReactDOM from 'react-dom'
import MemoryRouter from '../MemoryRouter'
import Router from '../Router'
import createMemoryHistory from 'history/createMemoryHistory'
import Route from '../Route'

describe('A <Route>', () => {
  it('renders at the root', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('does not render when it does not match', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/bunnies' ]}>
        <Route path="/flowers" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })

  it('can use a `location` prop instead of `context.route.location`', () => {
    const TEXT = 'tamarind chutney'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/mint' ]}>
        <Route
          location={{ pathname: '/tamarind' }}
          path="/tamarind"
          render={() => (
            <h1>{TEXT}</h1>
          )}
        />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })


  describe('component prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    const Home = () => <div>{TEXT}</div>
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" component={Home} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('render prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => <div>{TEXT}</div>} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('children function prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" children={() => <div>{TEXT}</div>} />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('children element prop', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/">
          <div>{TEXT}</div>
        </Route>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('supports preact by nulling out children prop when empty array is passed', () => {
    const TEXT = 'Mrs. Kato'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/' ]}>
        <Route path="/" render={() => (
          <h1>{TEXT}</h1>
        )}>
          {[]}
        </Route>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('matches using nextContext when updating', () => {
    const node = document.createElement('div')

    let push
    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/sushi/california' ]}>
        <Route path="/sushi/:roll" render={({ history, match }) => {
          push = history.push
          return <div>{match.url}</div>
        }}/>
      </MemoryRouter>
    ), node)
    push('/sushi/spicy-tuna')
    expect(node.innerHTML).toContain('/sushi/spicy-tuna')
  })

  describe('context', () => {
    const node = document.createElement('div')

    let rootContext
    const ContextChecker = (props, context) => {
      rootContext = context
      return null
    }

    ContextChecker.contextTypes = {
      history: React.PropTypes.object,
      route: React.PropTypes.object
    }

    afterEach(() => {
      rootContext = undefined
      ReactDOM.unmountComponentAtNode(node)
    })

    it('places its match on context.route', () => {
      ReactDOM.render(
        <MemoryRouter initialEntries={[ '/nested/location' ]}>
          <Route path='/nested' component={ContextChecker} />
        </MemoryRouter>,
        node
      )

      expect(rootContext.route.match.url).toEqual('/nested')
      expect(rootContext.route.match.path).toEqual('/nested')
      expect(rootContext.route.match.params).toEqual({})
      expect(rootContext.route.match.isExact).toEqual(false)
    })

    it('places its prop location on context.route', () => {
      const propLocation = {
        pathname: '/other-location'
      }
      ReactDOM.render(
        <MemoryRouter initialEntries={[ '/nested/location' ]}>
          <Route
            location={propLocation}
            path='/other-location'
            component={ContextChecker}
          />
        </MemoryRouter>,
        node
      )
      expect(rootContext.route.location).toEqual(propLocation)   
    })

    it('mutates route object when updating', () => {
      let location, goForward

      class UpdateBlocker extends React.Component {
        static contextTypes = {
          history: React.PropTypes.object
        }

        shouldComponentUpdate() {
          return false
        }

        render() {
          return <Listener />
        }

        componentDidMount() {
          goForward = this.context.history.goForward
        }
      }

      class Listener extends React.Component {
        static contextTypes = {
          history: React.PropTypes.shape({
            listen: React.PropTypes.func.isRequired
          }).isRequired,
          route: React.PropTypes.object.isRequired
        }

        componentWillMount() {
          this.unlisten = this.context.history.listen(() => {
            this.forceUpdate()
          })
        }

        render() {
          location = this.context.route.location
          return null
        }
      }

      const history = createMemoryHistory({
        initialEntries: [ '/bubblegum', '/shoelaces' ]
      })

      ReactDOM.render((
        <Router history={history}>
          <Route render={() => (
            <UpdateBlocker />
          )}/>
        </Router>
      ), node)

      expect(location.pathname).toBe('/bubblegum')
      goForward()
      expect(location.pathname).toBe('/shoelaces')
    })
  })
})

describe('<Route> render props', () => {
  const history = createMemoryHistory()
  const node = document.createElement('div')

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(node)
  })

  it('passes `{ match, location, history }` props to `render`', () => {
    let actual = null

    ReactDOM.render((
      <Router history={history}>
        <Route path="/" render={(props) => (actual = props) && null}/>
      </Router>
    ), node)

    expect(actual.history).toBe(history)
    expect(actual.match).toBeAn('object')
    expect(actual.location).toBeAn('object')
  })

  it('passes `{ match, location, history }` props to `component`', () => {
    let actual = null
    const Component = (props) => (actual = props) && null

    ReactDOM.render((
      <Router history={history}>
        <Route path="/" component={Component}/>
      </Router>
    ), node)

    expect(actual.history).toBe(history)
    expect(actual.match).toBeAn('object')
    expect(actual.location).toBeAn('object')
  })

  it('passes `{ match, location, history }` props to `children`', () => {
    let actual = null

    ReactDOM.render((
      <Router history={history}>
        <Route path="/" children={(props) => (actual = props) && null}/>
      </Router>
    ), node)

    expect(actual.history).toBe(history)
    expect(actual.match).toBeAn('object')
    expect(actual.location).toBeAn('object')
  })
})

describe('A <Route exact>', () => {
  it('renders when the URL does not have a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath/' ]}>
        <Route exact path="/somepath" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  it('renders when the URL has trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath' ]}>
        <Route exact path="/somepath/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })
})

describe('A <Route exact strict>', () => {
  it('does not render when the URL has a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath/' ]}>
        <Route exact strict path="/somepath" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })

  it('does not render when the URL does not have a trailing slash', () => {
    const TEXT = 'bubblegum'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/somepath' ]}>
        <Route exact strict path="/somepath/" render={() => (
          <h1>{TEXT}</h1>
        )}/>
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toNotContain(TEXT)
  })
})

describe('A <Route location>', () => {
  it('can use a `location` prop instead of `router.location`', () => {
    const TEXT = 'tamarind chutney'
    const node = document.createElement('div')

    ReactDOM.render((
      <MemoryRouter initialEntries={[ '/mint' ]}>
        <Route
          location={{ pathname: '/tamarind' }}
          path="/tamarind"
          render={() => (
            <h1>{TEXT}</h1>
          )}
        />
      </MemoryRouter>
    ), node)

    expect(node.innerHTML).toContain(TEXT)
  })

  describe('children', () => {
    it('uses parent\'s prop location', () => {
      const TEXT = 'cheddar pretzel'
      const node = document.createElement('div')

      ReactDOM.render((
        <MemoryRouter initialEntries={[ '/popcorn' ]}>
          <Route
            location={{ pathname: '/pretzels/cheddar' }}
            path="/pretzels"
            render={() => (
              <Route path='/pretzels/cheddar' render={() => (
                <h1>{TEXT}</h1>
              )} />
            )}
          />
        </MemoryRouter>
      ), node)

      expect(node.innerHTML).toContain(TEXT)
    })
    
    it('continues to use parent\'s prop location after navigation', () => {
      const TEXT = 'cheddar pretzel'
      const node = document.createElement('div')
      let push
      ReactDOM.render((
        <MemoryRouter initialEntries={[ '/popcorn' ]}>
          <Route
            location={{ pathname: '/pretzels/cheddar' }}
            path="/pretzels"
            render={({ history }) => {
              push = history.push
              return (
                <Route path='/pretzels/cheddar' render={() => (
                <h1>{TEXT}</h1>
              )} />
              )
            }}
          />
        </MemoryRouter>
      ), node)
      expect(node.innerHTML).toContain(TEXT)
      push('/chips')
      expect(node.innerHTML).toContain(TEXT)
    })
  })
})
