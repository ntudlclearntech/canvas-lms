/*
 * Copyright (C) 2018 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import React, { Component } from 'react';
import { string } from 'prop-types';
import formatMessage from '../../format-message';

import Indicator from './Indicator';

export default function MissingIndicator (props) {
  const badgeMessage = formatMessage('Missing items for {title}', {title: props.title});
  return <Indicator
    title={badgeMessage}
    variant="danger"
  />;
}

MissingIndicator.propTypes = {
  title: string.isRequired,
};
