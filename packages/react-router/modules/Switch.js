import React, { PropTypes } from 'react'
import warning from 'warning'
import matchPath from './matchPath'

/**
 * The public API for rendering the first <Route> that matches.
 */
class Switch extends React.Component {
  static contextTypes = {
    react_router_route: PropTypes.object.isRequired
  }

  static propTypes = {
    children: PropTypes.node,
    location: PropTypes.object
  }

  componentWillReceiveProps(nextProps) {
    warning(
      !(nextProps.location && !this.props.location),
      '<Switch> elements should not change from uncontrolled to controlled (or vice versa). You initially used no "location" prop and then provided one on a subsequent render.'
    )

    warning(
      !(!nextProps.location && this.props.location),
      '<Switch> elements should not change from controlled to uncontrolled (or vice versa). You provided a "location" prop initially but omitted it on a subsequent render.'
    )
  }

  render() {
    const { react_router_route } = this.context
    const { children } = this.props
    const location = this.props.location || react_router_route.location

    let match, child
    React.Children.forEach(children, element => {
      const { path: pathProp, exact, strict, from } = element.props
      const path = pathProp || from

      if (match == null) {
        child = element
        match = path ? matchPath(location.pathname, { path, exact, strict }) : react_router_route.match
      }
    })

    return match ? React.cloneElement(child, { location, computedMatch: match }) : null
  }
}

export default Switch
