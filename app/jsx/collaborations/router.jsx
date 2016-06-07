define([
  'react',
  'page',
  'qs',
  'redux',
  'jsx/collaborations/CollaborationsApp',
  'jsx/collaborations/actions/collaborationsActions',
  'jsx/collaborations/store/store'
], function (React, page, qs, redux, CollaborationsApp, actions, store) {
  /**
   * Route Handlers
   */
  function renderShowCollaborations (ctx) {
    store.dispatch(actions.getLTICollaborators(ctx.params.context, ctx.params.contextId));
    store.dispatch(actions.getCollaborations(ctx.params.context, ctx.params.contextId));

    let view = () => {
      let state = store.getState();
      React.render(<CollaborationsApp applicationState={state} actions={actions} />, document.getElementById('content'));
    };
    store.subscribe(view);
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

  return {
    start () {
      page.start();
    }
  };

});
