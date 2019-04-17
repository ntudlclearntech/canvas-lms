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

import React, { Component } from "react";
import ReactDOM from "react-dom";
import Button from "@instructure/ui-buttons/lib/components/Button";
import RadioInput from "@instructure/ui-forms/lib/components/RadioInput";
import RadioInputGroup from "@instructure/ui-forms/lib/components/RadioInputGroup";
import Select from "@instructure/ui-forms/lib/components/Select";
import TextInput from "@instructure/ui-forms/lib/components/TextInput";
import ToggleDetails from "@instructure/ui-toggle-details/lib/components/ToggleDetails";
import "@instructure/ui-themes/lib/canvas";

import { renderIntoDiv, renderSidebarIntoDiv } from "../src/async";
import bridge from '../src/bridge'
import locales from "../src/locales";
import CanvasRce from "../src/rce/CanvasRce";
import * as fakeSource from "../src/sidebar/sources/fake";

// This is temporarily here so we have a place to develop the shared
// infrastructure until we get real plugins built.
import CanvasContentTray from '../src/rce/plugins/shared/CanvasContentTray';

function getProps(textareaId, language = "en", textDirection = "ltr") {
  return {
    language,
    editorOptions: () => {
      return {
        directionality: textDirection,
        height: "250px",
        plugins:
          "instructure_equation, instructure_image, instructure_equella, link, instructure_external_tools, instructure_record, instructure_links, table",
        // todo: add "instructure_embed" when the wiki sidebar work is done
        external_plugins: {},
        menubar: true,
        // todo: the toolbar building and automatic splitting functions should come into the service
        toolbar: [
          // basic buttons
          "bold italic underline forecolor backcolor removeformat alignleft aligncenter alignright outdent indent superscript subscript bullist numlist fontsizeselect formatselect",

          // plugin buttons ("instructure_links" will be changed to "link", but this is how
          //   it's currently sent over from canvas.  Once that's no longer true, the test
          //  page can just use "link" instead)
          "table link unlink instructure_equation instructure_image instructure_equella instructure_record"
        ]
      };
    },
    textareaClassName: "exampleClassOne exampleClassTwo",
    textareaId
  };
}

function renderDemos({ host, jwt, lang, contextType, contextId, dir, sourceType }) {
  renderIntoDiv(
    document.getElementById("editor1"),
    getProps("textarea1", lang, dir)
  );

  renderIntoDiv(
    document.getElementById("editor2"),
    getProps("textarea2", lang, dir)
  );

  ReactDOM.render(
    <CanvasRce rceProps={getProps("textarea3", lang, dir)} />,
    document.getElementById("editor3")
  );

  const parsedUrl = new URL(window.location.href);
  if (parsedUrl.searchParams.get("sidebar") === "no") {
    return;
  }

  const sidebarEl = document.getElementById("sidebar");
  ReactDOM.render(<div />, sidebarEl);
  renderSidebarIntoDiv(sidebarEl, {
    source: jwt && sourceType === 'real' ? undefined : fakeSource,
    host,
    jwt,
    contextType,
    contextId,
    canUploadFiles: true
  });
}

function getSetting(settingKey, defaultValue) {
  return localStorage.getItem(settingKey) || defaultValue
}

function saveSettings(state) {
  ['dir', 'sourceType', 'lang', 'host', 'jwt', 'contextType', 'contextId'].forEach(settingKey => {
    localStorage.setItem(settingKey, state[settingKey])
  })
}

class DemoOptions extends Component {
  state = {
    dir: getSetting('dir', 'ltr'),
    sourceType: getSetting('sourceType', 'fake'),
    lang: getSetting('lang', 'en'),
    host: getSetting('host', 'https://rich-content-iad.inscloudgate.net'),
    jwt: getSetting('jwt', ''),
    contextType: getSetting('contextType', 'course'),
    contextId: getSetting('contextId', '1')
  };

  handleChange = () => {
    document.documentElement.setAttribute("dir", this.state.dir);
    saveSettings(this.state)
    renderDemos(this.state);
  };

  componentDidMount() {
    this.handleChange();
  }

  render() {
    return (
      <ToggleDetails expanded summary="Configuration Options">
        <CanvasContentTray
          bridge={bridge}
          contextId={this.state.contextId}
          contextType={this.state.contextType}
          host={this.state.host}
          jwt={this.state.sourceType === 'real' ? this.state.jwt : ''}
          source={this.state.jwt && this.state.sourceType === 'real' ? undefined : fakeSource}
        />

        <form
          onSubmit={e => {
            e.preventDefault();
            this.handleChange();
          }}
        >
          <RadioInputGroup
            description="Source Type"
            variant="toggle"
            name="source"
            onChange={(event, value) => this.setState({ sourceType: value })}
            value={this.state.sourceType}
          >
            <RadioInput label="Fake" value="fake" />

            <RadioInput label="Real" value="real" />
          </RadioInputGroup>

          <RadioInputGroup
            description="Text Direction"
            variant="toggle"
            name="dir"
            value={this.state.dir}
            onChange={(event, value) => this.setState({ dir: value })}
          >
            <RadioInput label="LTR" value="ltr" />
            <RadioInput label="RTL" value="rtl" />
          </RadioInputGroup>

          <Select
            label="Language"
            value={this.state.lang}
            onChange={(_e, option) => this.setState({ lang: option.value })}
          >
            {["en", ...Object.keys(locales)].map(locale => (
              <option key={locale} value={locale}>
                {locale}
              </option>
            ))}
          </Select>

          <TextInput
            label="API Host"
            value={this.state.host}
            onChange={e => this.setState({ host: e.target.value })}
          />

          <TextInput
            label="Canvas JWT"
            value={this.state.jwt}
            onChange={e => this.setState({ jwt: e.target.value })}
          />

          <Select
            label="Context Type"
            selectedOption={this.state.contextType}
            onChange={(_e, option) =>
              this.setState({ contextType: option.value })
            }
          >
            <option value="course">Course</option>
            <option value="group">Group</option>
            <option value="user">User</option>
          </Select>

          <TextInput
            label="Context ID"
            value={this.state.contextId}
            onChange={e => this.setState({ contextId: e.target.value })}
          />

          <Button type="submit">Update</Button>
        </form>
      </ToggleDetails>
    );
  }
}

ReactDOM.render(<DemoOptions />, document.getElementById("options"));
