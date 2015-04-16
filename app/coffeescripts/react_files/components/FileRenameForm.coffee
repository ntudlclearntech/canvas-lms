define [
  'i18n!file_rename_form'
  'react'
  'compiled/react/shared/utils/withReactElement'
  'jsx/shared/modal'
  'jsx/shared/modal-content'
  'jsx/shared/modal-buttons'
], (I18n, React, withReactElement, Modal, ModalContent, ModalButtons) ->
  Modal = React.createFactory(Modal)

  FileRenameForm = React.createClass
    displayName: 'FileRenameForm'

    # dialog for renaming

    propType:
      fileOptions: React.PropTypes.object
      onNameConflictResolved: React.PropTypes.func.isRequired

    getInitialState: ->
      isEditing: false
      fileOptions: @props.fileOptions

    componentWillReceiveProps: (newProps) ->
      @setState(fileOptions: newProps.fileOptions, isEditing: false)

    handleRenameClick: ->
      @setState isEditing: true

    handleBackClick: ->
      @setState isEditing: false

    # pass back expandZip to preserve options that was possibly already made
    # in a previous modal
    handleReplaceClick: ->
      @refs.canvasModal.closeModal() if @props.closeOnResolve
      @props.onNameConflictResolved({
        file: @state.fileOptions.file
        dup: 'overwrite'
        expandZip: @state.fileOptions.expandZip
      })

    # pass back expandZip to preserve options that was possibly already made
    # in a previous modal
    handleChangeClick: ->
      @refs.canvasModal.closeModal() if @props.closeOnResolve
      @props.onNameConflictResolved({
        file: @state.fileOptions.file
        dup: 'rename'
        name: @refs.newName.getDOMNode().value
        expandZip: @state.fileOptions.expandZip
      })

    handleFormSubmit: (e) ->
      e.preventDefault()
      @handleChangeClick()

    buildContent: withReactElement ->
      nameToUse = @state.fileOptions?.name || @state.fileOptions?.file.name
      if !@state.isEditing
        div {ref: "bodyContent"},
          p {id: "renameFileMessage"}, I18n.t('message','An item named "%{name}" already exists in this location. Do you want to replace the existing file?', {name: nameToUse})
      else
        div {ref: "bodyContent"},
          p {}, I18n.t('prompt', 'Change "%{name}" to', {name: nameToUse})
          form onSubmit: @handleFormSubmit,
            label className: 'file-rename-form__form-label',
              I18n.t('name', 'Name')
            input(classNae: 'input-block-level', type: 'text', defaultValue: nameToUse, ref: 'newName'),

    buildButtons: withReactElement ->
      if !@state.isEditing
        [
          button
            ref: 'renameBtn'
            className: 'btn btn-default'
            onClick: @handleRenameClick,
              (I18n.t('change_name', 'Change Name'))
         ,
          button
            ref: 'replaceBtn'
            className: 'btn btn-primary'
            onClick: @handleReplaceClick,
              (I18n.t('replace', 'Replace'))
        ]
      else
        [
          button
            ref: 'backBtn'
            className: 'btn btn-default'
            onClick: @handleBackClick,
              I18n.t('back', 'Back')
        ,
          button
            ref: 'commitChangeBtn'
            className: 'btn btn-primary'
            onClick: @handleChangeClick,
              I18n.t('change', 'Change')
         ]

    render: withReactElement ->
      Modal {
        className: 'ReactModal__Content--canvas ReactModal__Content--mini-modal',
        ref: 'canvasModal',
        isOpen: @props.fileOptions?,
        title: I18n.t('rename_title', 'Copy'),
        onRequestClose: @props.onClose,
        closeWithX: @props.closeWithX
      },
        ModalContent {},
          @buildContent()
        ModalButtons {},
          @buildButtons()
