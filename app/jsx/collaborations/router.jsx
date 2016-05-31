define([
  'react',
  'page',
  'qs',
  'redux',
  'jsx/collaborations/CollaborationsApp',
  'jsx/collaborations/actions/collaborationsActions',
  'jsx/collaborations/store/store'
], function (React, page, qs, redux, CollaborationsApp, collaborationsActions, store) {
  let unsubscribe
  let actions = redux.bindActionCreators(collaborationsActions, store.dispatch)

  /**
   * Route Handlers
   */
  function renderShowCollaborations (ctx) {
    let view = () => {
      let state = store.getState();
      React.render(<CollaborationsApp applicationState={state} actions={actions} />, document.getElementById('content'));
    };
    unsubscribe = store.subscribe(view);
    view();
  }

  /**
   * Middlewares
   */

  function parseQueryString (ctx, next) {
    ctx.query = qs.parse(ctx.querystring);
    next();
  }

  /**
   * Route Configuration
   */
  page('*', parseQueryString); // Middleware to parse querystring to object
  page('/:context(courses|groups)/:contextId/lti_collaborations', renderShowCollaborations);
  page.exit('*', unsubscribe)

  return {
    start () {
      page.start();
    }
  };

});
