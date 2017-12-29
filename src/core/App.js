import React, { PureComponent } from 'react'
import { StaticRouter, BrowserRouter, Route } from 'react-router-dom'
import URL from 'url-parse'
import { Data } from 'react-chunky'
import { createSectionRoutes } from './Router'
import { Redirect } from 'react-router'
import uuid from 'uuid'
import Cache from './Cache'

export default class App extends PureComponent {

  constructor (props) {
    super(props)
    this.state = { loading: true }
    this._menu = []
    this._cache = new Cache()
    this._userLogin = this.userLogin.bind(this)
    this._userLogout = this.userLogout.bind(this)
  }

  componentDidMount () {
    Data.Cache.retrieveAuth().then(account => {
      this._resolve(account)
      this.setState({ loading: false, account })
    }).catch(error => {
      this._resolve()
      this.setState({ loading: false })
    })
  }

  get cache () {
    return this._cache
  }

  userLogin (account) {
    Data.Cache.cacheAuth(account).then(() => {
      this._resolve(account)
      this.setState({ account })
    })
  }

  userLogout () {
    Data.Cache.clearAuth().then(account => {
      this._resolve()
      this.setState({ account: undefined })
    })
  }

  _resolveTransitionFromURI (uri) {
    const url = new URL(uri, true)
    return {
      name: `show${url.hostname.charAt(0).toUpperCase()}${url.hostname.substring(1).toLowerCase()}`,
      type: url.protocol.slice(0, -1).toLowerCase(),
      route: url.hostname
    }
  }

  _createSectionNavigatorRoutes (element, section) {
    // We want to look at a stack element and figure out its parent chunk;
    // Note that chunks may also have flavours so this looks for the flavor, if any
    const [ chunkName, chunkFlavorName ] = element.split('/')

    // This is our chunk, if it actually exists
    const chunk = this.props.chunks[chunkName]

    if (!chunk) {
      // Let's verify that it actually points to a real chunk
      return
    }

    if (chunkFlavorName && (!chunk.flavors || !chunk.flavors[chunkFlavorName])) {
      // Great, let's check the flavor now
      return
    }

    if (!chunk.routes || chunk.routes.length === 0) {
      // One last thing, let's also make sure the chunk has routes
      return
    }

    // These routes will be the ones we want to parse out of the chunk, as necessary
    var routes = []

    var rootRoute = {}

    // Let's build up global transitions, if any
    var globalTransitions = {}

    if (this.props.transitions) {
      this.props.transitions.forEach(transitionUri => {
          // Let's resolve global transitions
        const transition = this._resolveTransitionFromURI(transitionUri)
        globalTransitions[transition.name] = transition
      })
    }

    for (let routeName in chunk.routes) {
      // Great, this chunk has routes, let's look through all of them
      var route = chunk.routes[routeName]

      if (!route.screen) {
        // This route has no screens
        continue
      }

      if (Object.keys(rootRoute).length === 0) {
        route.root = true
        route.menuTitle = route.title
        rootRoute = Object.assign({}, route)

        // Construct a menu
        if (!route.skipMenu) {
          var link = `${this.menu.length === 0 ? '/' : route.path}`
          this._menu.push({
            id: `${this.menu.length}`,
            icon: route.icon.replace('-', '_'),
            title: route.menuTitle,
            path: link
          })
        }
      } else {
        route.icon = rootRoute.icon
        route.menuTitle = rootRoute.menuTitle
      }

      // Let's build up the transitions, if any
      var transitions = {}

      if (chunk.transitions) {
        chunk.transitions.forEach(transitionUri => {
          // Parse this transition's URI
          const transition = this._resolveTransitionFromURI(transitionUri)
          const routeData = chunk.routes[transition.route]
          if (transition.route && routeData) {
            // This is a local transition, so let's resolve locally
            transition.data = Object.assign({}, routeData)
            transition.route = `${section.name}/${chunkName}/${transition.route}`
            transitions[transition.name] = transition
            return
          }

          if (globalTransitions[transition.name]) {
            // Let's look through the global transitions, if any
            transitions[transition.name] = Object.assign({}, globalTransitions[transition.name])
          }
        })
      }

      // Let's pass over the theme as well
      const theme = this.props.theme

      // For each route, we want to compose its properties
      const screenProps = Object.assign({
        // Defaults
        cache: this.cache,
        strings: {},
        account: section.account,
        onUserLogin: this._userLogin,
        onUserLogout: this._userLogout,
        info: this.props.info,
        startOperationsOnMount: true
      }, { theme, transitions, ...route, chunkName, menu: this.menu }, this.props.web)

      // Resolve strings
      var resolvedStrings = {}
      for (const string in screenProps.strings) {
        resolvedStrings[string] = this.props.strings[screenProps.strings[string]] || `??${screenProps.strings[string]}??`
      }
      screenProps.strings = Object.assign({}, this.props.strings, resolvedStrings)

      const screenPath = route.path || `/${routeName}`
      const screenId = `${chunkName}/${routeName}`

      const ScreenRoute = this._makeScreenRoute(screenPath, screenId, route, screenProps)
      routes.push(ScreenRoute)

      if (route.variants) {
        const ScreenVariantRoute = this._makeScreenRoute(`${screenPath}/:variant`, screenId, route, screenProps)
        routes.push(ScreenVariantRoute)
      }
    }

    // We've got ourselves some routes so we should be done with this
    return routes
  }

  _makeScreenRoute (screenPath, screenId, route, screenProps) {
    const RouteScreen = route.screen
    const Screen = (props) => {
      return <RouteScreen {...props} {...screenProps} />
    }

    return <Route
      exact
      refresh
      key={`${screenId}${screenPath}`}
      path={screenPath}
      render={(props) => <Screen {...screenProps} {...props} />} />
  }

  _createSectionNavigator (section) {
    return createSectionRoutes(section, this._createSectionNavigatorRoutes.bind(this))
  }

  _resolve (account) {
    this._routes = []
    this._sections = []

    for (const sectionName in this.props.sections) {
      // Look through all the app's sections and for each, build defaults if necessary
      var section = this.props.sections[sectionName]
      section.name = sectionName
      section.account = account
      section.layout = section.layout || 'default'
      section.navigator = this._createSectionNavigator(section)
      this._sections.push(section)
      this._routes = this._routes.concat(section.navigator.routes)
    }
  }

  get menu () {
    return this._menu || {}
  }

  get routes () {
    return this._routes || []
  }

  get sections () {
    return this._sections || []
  }

  renderStatic () {
    this._resolve()
    return (
      <StaticRouter location={this.props.route.location} context={this.props.route}>
        <div>
          { this.routes }
        </div>
      </StaticRouter>)
  }

  renderRoutes () {
    return this.routes
  }

  render () {
    if (this.props.route && !this.props.redirect) {
      return this.renderStatic()
    }

    if (!this.routes || this.routes.length === 0) {
      return (<div />)
    }

    return (<BrowserRouter>
      <div>
        { this.renderRoutes() }
      </div>
    </BrowserRouter>)
  }
}
