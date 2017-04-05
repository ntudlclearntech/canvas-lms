import React from 'react'
import I18n from 'i18n!new_user_tutorial'
import Typography from 'instructure-ui/lib/components/Typography'
import Heading from 'instructure-ui/lib/components/Heading'

  const HomeTray = () => (
    <div>
      <Heading as="h2" level="h1" >{I18n.t('Home')}</Heading>
      <Typography size="large" as="p">
        {I18n.t('This is your course landing page!')}
      </Typography>
      <Typography as="p">
        {
          I18n.t("When people visit your course, this is the first page they'll see. " +
                "We've set your home page to Modules, but you have the option to change it.")
        }
      </Typography>
    </div>
  );

export default HomeTray
