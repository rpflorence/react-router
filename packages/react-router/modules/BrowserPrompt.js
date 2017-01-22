import React, { PropTypes } from 'react'
import Prompt from './Prompt'

const BEFOREUNLOAD = "beforeunload"; // see: http://stackoverflow.com/questions/39094138/reactjs-event-listener-beforeunload-added-but-not-removed

var UnloadComponent = ComposedComponent => class extends React.Component {
  static contextTypes = {
    router: PropTypes.shape({
        history: PropTypes.shape({
            block: PropTypes.func.isRequired
        }).isRequired
    }).isRequired
  }

  static propTypes = {
    when: PropTypes.bool,
    message: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.string
    ]).isRequired,
    beforeUnload: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.bool
    ])
  }

  constructor(props) {
    super(props)
  }

  onbeforeunload(e) {
    var dialogText = "Changes you made may not be saved."
    e.returnValue = dialogText
    return dialogText
  }

  enableUnload(_onbeforeunload) {
    if(this._subscribed) { return }
    this._subscribed = _onbeforeunload ? _onbeforeunload : this.onbeforeunload;
    window.addEventListener(BEFOREUNLOAD, this._subscribed)
  }

  disableUnload() {
    window.removeEventListener(BEFOREUNLOAD, this._subscribed)
    delete this._subscribed
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.beforeUnload === true && this.props.beforeUnload === false) {
      this.enableUnload()
    } else if (nextProps.beforeUnload === false && 
      (this.props.beforeUnload === true || typeof this.props.beforeUnload === "function")) {
      this.disableUnload()
    }

    if (typeof nextProps.beforeUnload === "function") {
      this.enableUnload(nextProps.beforeUnload)
    }    
  }

  componentWillMount() {
    if (this.props.beforeUnload)
      if (typeof this.props.beforeUnload === "function") {
        this.enableUnload(this.props.beforeUnload)
      } else {
        this.enableUnload()        
      }
  }

  componentWillUnmount() {
    this.disableUnload()
  }

  render() {
    return <ComposedComponent {...this.props} />
  }
}

let BrowserPrompt = UnloadComponent(Prompt)
export default BrowserPrompt