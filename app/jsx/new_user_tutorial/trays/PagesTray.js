import React from 'react'
import I18n from 'i18n!new_user_tutorial'
import Heading from 'instructure-ui/lib/components/Heading'
import Typography from 'instructure-ui/lib/components/Typography'

  const PagesTray = () => (
    <div>
      <div>
        <Heading as="h2" level="h1" >{I18n.t('Pages')}</Heading>
        <Typography size="large" as="p">
          {I18n.t('Create educational resources')}
        </Typography>
        <Typography as="p">
          {
            I18n.t(`Build Pages containing content and educational resources that
                    help students learn but aren't assignments. Include text,
                    multimedia, and links to files and external resources.`)
          }
        </Typography>
      </div>
    </div>
  );

export default PagesTray
