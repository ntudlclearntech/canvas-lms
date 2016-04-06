define([], () => {

  /**
   * This makes the pathname always leave off a potential trailing
   * slash.
   */
  const regularizePathname = (ctx, next) => {
    ctx.originalPathname = ctx.pathname;
    ctx.pathname = ctx.pathname.replace(/\/$/, '');
    next();
  };

  return regularizePathname;

});
