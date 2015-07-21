/** @jsx React.DOM */

define([
  'i18n!theme_editor',
  'react',
  'react-modal',
  'str/htmlEscape',
  'compiled/fn/preventDefault',
  'compiled/models/Progress',
  'compiled/react_files/components/ProgressBar',
  './PropTypes',
  './ThemeEditorAccordion',
  './SharedBrandConfigPicker'
], (I18n, React, Modal, htmlEscape, preventDefault, Progress, ProgressBar, customTypes, ThemeEditorAccordion, SharedBrandConfigPicker) => {

  Modal.setAppElement(document.body)

  function findVarDef (variableSchema, variableName) {
    for (var i = 0; i < variableSchema.length; i++) {
      for (var j = 0; j < variableSchema[i].variables.length; j++) {
        var varDef =  variableSchema[i].variables[j]
        if (varDef.variable_name === variableName){
          return varDef
        }
      }
    }
  }

  function submitHtmlForm(action, method, md5) {
    $(`
      <form hidden action="${htmlEscape(action)}" method="POST">
        <input name="_method" type="hidden" value="${htmlEscape(method)}" />
        <input name="authenticity_token" type="hidden" value="${htmlEscape($.cookie('_csrf_token'))}" />
        <input name="brand_config_md5" value="${htmlEscape(md5 ? md5 : '')}" />
      </form>
    `).appendTo('body').submit()
  }

  return React.createClass({

    displayName: 'ThemeEditor',

    propTypes: {
      brandConfig: customTypes.brandConfig,
      hasUnsavedChanges: React.PropTypes.bool.isRequired,
      variableSchema: customTypes.variableSchema,
      sharedBrandConfigs: customTypes.sharedBrandConfigs
    },

    getInitialState() {
      return {
        somethingChanged: false,
        changedValues: {},
        showProgressModal: false,
        progress: 0
      }
    },

    invalidForm() {
      return Object.keys(this.state.changedValues).some((key) => {
        return this.state.changedValues[key].invalid
      })
    },

    somethingChanged(variableName, newValue, isInvalid) {
      var change = {val: newValue, invalid: isInvalid}
      this.state.changedValues[variableName] = change
      this.setState({
        somethingChanged: true,
        changedValues: this.state.changedValues
      })
    },

    onProgress(data) {
      this.setState({progress: data.completion})
    },

    getDefault(variableName) {
      var val = this.state.changedValues[variableName] && this.state.changedValues[variableName].val
      if (val) return val
      if (val !== '') {
        val = this.props.brandConfig.variables[variableName]
        if (val) return val
      }
      val = findVarDef(this.props.variableSchema, variableName).default
      if (val && val[0] === '$') return this.getDefault(val.slice(1))
      return val
    },

    saveToSession(md5) {
      submitHtmlForm('/brand_configs/save_to_user_session', 'POST', md5)
    },

    handleCancelClicked() {
      if (this.props.hasUnsavedChanges || this.state.somethingChanged) {
        var msg = I18n.t('You are about to lose any changes that you have not yet applied to your account.\n\n' +
                         'Would you still like to proceed?')
        if (!confirm(msg)) {
          return;
        }
      }
      submitHtmlForm('/brand_configs', 'DELETE');
    },

    handleApplyClicked() {
      var msg = I18n.t('This will apply these changes to your entire account. Would you like to proceed?')
      if (confirm(msg)) submitHtmlForm('/brand_configs/save_to_account', 'POST')
    },


    handleFormSubmit() {
      var newMd5

      this.setState({showProgressModal: true})

      $.ajax({
        url: '/brand_configs',
        type: 'POST',
        data: new FormData(this.refs.ThemeEditorForm.getDOMNode()),
        processData: false,
        contentType: false,
        dataType: "json"
      })
      .pipe((resp) => {
        newMd5 = resp.brand_config.md5
        if (resp.progress) {
          return new Progress(resp.progress).poll().progress(this.onProgress)
        }
      })
      .pipe(() => this.saveToSession(newMd5))
      .fail(() => {
        alert(I18n.t('An error occured trying to generate this theme, please try again.'))
        this.setState({showProgressModal: false})
      })
    },

    render() {
      return (
        <div id="main">
          <form
            ref="ThemeEditorForm"
            onSubmit={preventDefault(this.handleFormSubmit)}
            encType="multipart/form-data"
            acceptCharset="UTF-8"
            action="/brand_configs"
            method="POST"
            className="Theme__container">
            <input name="utf8" type="hidden" value="✓" />
            <input name="authenticity_token" type="hidden" value={$.cookie('_csrf_token')} />
            <div className="Theme__editor">

              <div className="Theme__editor-header">
                <div className="Theme__editor-header_title">
                  <i className="Theme__editor-header_title-icon icon-instructure" />
                  <h1 className="Theme__editor-header_title-text">
                    {I18n.t('Theme Editor')}
                  </h1>
                </div>

                <div className="Theme__editor-header_actions">
                  <span
                    data-tooltip="bottom"
                    title={this.state.somethingChanged ?
                      I18n.t('You need to "Preview Your Changes" before applying to everyone.') :
                      null
                    }
                  >
                    <button
                      type="button"
                      className="Theme__editor-header_button Button Button--success"
                      disabled={!this.props.hasUnsavedChanges || this.state.somethingChanged}
                      onClick={this.handleApplyClicked}
                    >
                      {I18n.t('Apply')}
                    </button>

                  </span>
                  <button
                    type="button"
                    className="Theme__editor-header_button Button"
                    onClick={this.handleCancelClicked}
                  >
                    {I18n.t('Cancel')}
                  </button>
                </div>
              </div>

              <div className="Theme__editor-tabs">
                <div id="te-editor-panel" className="Theme__editor-tabs_panel">
                  <SharedBrandConfigPicker
                    sharedBrandConfigs={this.props.sharedBrandConfigs}
                    activeBrandConfigMd5={this.props.brandConfig.md5}
                    saveToSession={this.saveToSession}
                  />
                  <ThemeEditorAccordion
                    variableSchema={this.props.variableSchema}
                    brandConfigVariables={this.props.brandConfig.variables}
                    getDefault={this.getDefault}
                    changedValues={this.state.changedValues}
                    somethingChanged={this.somethingChanged}
                  />
                </div>
              </div>
              
              <div className="Theme__preview">
                { this.state.somethingChanged ?
                  <div className="Theme__preview-overlay">
                    <div className="Theme__preview-overlay__container">
                      <button 
                        type="submit"
                        className="Button Button--primary"
                        disabled={this.invalidForm()}>
                        <i className="icon-refresh" />
                        <span className="Theme__preview-button-text">
                          {I18n.t('Preview Your Changes')}
                        </span>
                      </button>
                    </div>
                  </div>
                : null }
                <iframe ref="previewIframe" src="/?editing_brand_config=1" />
              </div>

            </div>
          </form>

          <Modal
            isOpen={this.state.showProgressModal}
            className='ReactModal__Content--canvas ReactModal__Content--mini-modal'
            overlayClassName='ReactModal__Overlay--Theme__editor_progress'>
            <div className="Theme__editor_progress">
              <h4>{I18n.t('Generating Preview...')}</h4>
              <ProgressBar
                progress={this.state.progress}
                title={I18n.t('%{percent} complete', {
                  percent: I18n.toPercentage(this.state.progress, {precision: 0})
                })}
              />
            </div>
          </Modal>

        </div>
      )
    }
  })
});
