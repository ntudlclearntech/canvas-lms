const React = require('react')

const Tray = require('instructure-ui/lib/components/Tray').default
const Container = require('instructure-ui/lib/components/Container').default
const Heading = require('instructure-ui/lib/components/Heading').default
const Button = require('instructure-ui/lib/components/Button').default
const Link = require('instructure-ui/lib/components/Link').default
const Alert = require('instructure-ui/lib/components/Alert').default
const TextInput = require('instructure-ui/lib/components/TextInput').default
const Select = require('instructure-ui/lib/components/Select').default
const ContextBox = require('instructure-ui/lib/components/ContextBox').default
const Grid = require('instructure-ui/lib/components/Grid').default
const GridRow = require('instructure-ui/lib/components/Grid/GridRow').default
const GridCol = require('instructure-ui/lib/components/Grid/GridCol').default
const Spinner = require('instructure-ui/lib/components/Spinner').default

const Typography = require('instructure-ui/lib/components/Typography').default
const IconCompleteSolid = require('instructure-icons/lib/Solid/IconCompleteSolid').default
const IconQuestionSolid = require('instructure-icons/lib/Solid/IconQuestionSolid').default

const dom = require('../utils/dom')
const rules = require('../rules')

class Checker extends React.Component {
  constructor () {
    super()

    this.state = {
      open: false,
      checking: false,
      errors: [],
      formState: {},
      formStateValid: false,
      errorIndex: 0
    }

    this.firstError = this.firstError.bind(this)
    this.nextError = this.nextError.bind(this)
    this.prevError = this.prevError.bind(this)
    this.selectCurrent = this.selectCurrent.bind(this)
    this.updateFormState = this.updateFormState.bind(this)
    this.fixIssue = this.fixIssue.bind(this)
    this.handleClose = this.handleClose.bind(this)
  }

  check () {
    this.setState({
      open: true,
      checking: true,
      errors: []
    }, () => this._check())
  }

  _check () {
    const errors = []
    if (this.props.node) {
      dom.walk(this.props.node, (node) => {
        for (let rule of rules) {
          if (!rule.test(node)) {
            errors.push({ node, rule })
          }
        }
      }, () => {
        this.setState({ errors, checking: false }, this.firstError)
      })
    }
  }

  firstError () {
    if (this.state.errors.length > 0) {
      this.setErrorIndex(0)
    }
  }

  nextError () {
    const next = (this.state.errorIndex + 1) % this.state.errors.length
    this.setErrorIndex(next)
  }

  prevError () {
    const len = this.state.errors.length
    const prev = (len + this.state.errorIndex - 1) % len
    this.setErrorIndex(prev)
  }

  setErrorIndex (errorIndex) {
    this.setState({ errorIndex }, this.selectCurrent)
  }

  selectCurrent () {
    const errorNode = this.errorNode()
    if (errorNode) {
      this.getFormState()
      dom.select(document, errorNode)
      errorNode.scrollIntoView(false)
    } else {
      this.firstError()
    }
  }

  error () {
    return this.state.errors[this.state.errorIndex]
  }

  errorNode () {
    const error = this.error()
    return error && error.node
  }

  errorRule () {
    const error = this.error()
    return error && error.rule
  }

  errorMessage () {
    const rule = this.errorRule()
    return rule && rule.message
  }

  getFormState () {
    const rule = this.errorRule()
    const node = this.errorNode()
    if (rule && node) {
      this.setState({ formState: rule.data(node), formStateValid: false })
    }
  }

  updateFormState ({target}) {
    const formState = Object.assign({}, this.state.formState)
    formState[target.name] = target.value
    this.setState({
      formState,
      formStateValid: this.formStateValid(formState)
    })
  }

  formStateValid (formState) {
    formState = formState || this.state.formState
    const node = this.errorNode()
    const rule = this.errorRule()
    if (!node || !rule) {
      return false
    }
    const clone = rule.update(node.cloneNode(true), formState)
    return rule.test(clone)
  }

  fixIssue (ev) {
    ev.preventDefault()
    const rule = this.errorRule()
    const node = this.errorNode()
    if (rule && node) {
      rule.update(node, this.state.formState)
      if (rule.test(node)) {
        this.removeError()
      }
    }
  }

  removeError () {
    const errors = this.state.errors.slice(0)
    errors.splice(this.state.errorIndex, 1)
    let errorIndex = this.state.errorIndex
    if (errorIndex >= errors.length) {
      errorIndex = 0
    }
    this.setState({ errors, errorIndex }, this.selectCurrent)
  }

  handleClose () {
    this.setState({ open: false })
  }

  render () {
    const rule = this.errorRule()
    return <Tray
      label="Accessibility Checker"
      isDismissable
      isOpen={this.state.open}
      onRequestClose={this.handleClose}
      placement="end"
      closeButtonLabel="Close Accessibility Checker"
    >
      <Container
        as="div"
        style={{width: '20rem'}}
        padding="medium"
       >
        <Heading level="h3" as="h2" margin="medium 0" color="brand">
          <IconCompleteSolid style={{
            verticalAlign: 'middle',
            paddingBottom: '0.1em'
          }} />{' '}
          Accessibility Checker
        </Heading>
        { this.state.errors.length > 0 &&
          <Container as="div">
            <Typography size="small">
              Issue {this.state.errorIndex + 1} of {this.state.errors.length}
            </Typography>
            <Alert variant="warning">{this.errorMessage()}</Alert>
            <form onSubmit={this.fixIssue}>
              { rule.form.map((f) => <Container as="div" margin="medium 0 0">
                { f.options
                  ? <Select
                      label={f.label}
                      name={f.dataKey}
                      value={this.state.formState[f.dataKey]}
                      onChange={this.updateFormState}
                     >
                      { f.options.map((o) =>
                        <option value={o[0]}>{o[1]}</option>
                      )}
                    </Select>
                  : <TextInput
                      label={f.label}
                      name={f.dataKey}
                      value={this.state.formState[f.dataKey]}
                      onChange={this.updateFormState}
                     />
                }
              </Container>) }
              <Container as="div" margin="medium 0 0">
                <Grid vAlign="middle" hAlign="space-between" colSpacing="none">
                  <GridRow>
                    <GridCol>
                      <Button onClick={this.prevError}>Prev</Button>{' '}
                      <Button onClick={this.nextError} variant="primary">Next</Button>
                    </GridCol>
                    <GridCol width="auto">
                      <Button
                        type="submit"
                        variant="success"
                        disabled={!this.state.formStateValid}
                      >
                        Apply Fix
                      </Button>
                    </GridCol>
                  </GridRow>
                </Grid>
              </Container>
            </form>
            <Container as="div" margin="x-large 0 0">
              <Heading level="h4" as="h3" padding="0 0 x-small">
                <IconQuestionSolid style={{
                  verticalAlign: 'middle',
                  paddingBottom: '0.1em'
                }} />{' '}
                Why
              </Heading>
              <Typography size="small">
                {rule.why + ' '}
                <Link href={rule.link} target="_blank">Learn more</Link>
              </Typography>
            </Container>
          </Container>
        }
        { this.state.errors.length === 0 && !this.state.checking &&
          <Alert variant="success">
            No accessibility issues were detected.
          </Alert>
        }
        { this.state.checking && 
          <Spinner margin="medium auto" />
        }
      </Container>
    </Tray>
  }
}

module.exports = Checker