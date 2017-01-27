import _ from 'underscore'
import React from 'react'
import classMunger from 'jsx/external_apps/lib/classMunger'

export default {
    getInitialState() {
      return {
        value: this.props.defaultValue
      }
    },

    handleChange(e) {
      e.preventDefault();
      this.setState({ value: e.target.value });
    },

    renderHint() {
      var hintText = this.props.hintText;
      if (!!this.getErrorMessage()) {
        hintText = this.getErrorMessage();
      }
      return hintText ? <span ref="hintText" className="hint-text">{hintText}</span> : null;
    },

    getClassNames() {
      return classMunger('control-group', {'error': this.props.id in this.props.errors});
    },

    getErrorMessage() {
      return this.props.errors[this.props.id];
    }
  }
