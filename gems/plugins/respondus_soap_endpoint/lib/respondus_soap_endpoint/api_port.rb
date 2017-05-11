#
# Copyright (C) 2011 - present Instructure, Inc.
#
# This file is part of Canvas.
#
# Canvas is free software: you can redistribute it and/or modify it under
# the terms of the GNU Affero General Public License as published by the Free
# Software Foundation, version 3 of the License.
#
# Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
# WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
# A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
# details.
#
# You should have received a copy of the GNU Affero General Public License along
# with this program. If not, see <http://www.gnu.org/licenses/>.

module RespondusSoapEndpoint
class RespondusAPIPort
  NsRespondusAPI = "urn:RespondusAPI"

  Methods = [
    [ XSD::QName.new(NsRespondusAPI, "IdentifyServer"),
      "urn:RespondusAPI#IdentifyServer",
      "identifyServer",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "identification", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "ValidateAuth"),
      "urn:RespondusAPI#ValidateAuth",
      "validateAuth",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "institution", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "GetServerItems"),
      "urn:RespondusAPI#GetServerItems",
      "getServerItems",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "itemList", ["NVPairList", "urn:RespondusAPI", "NVPairList"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "SelectServerItem"),
      "urn:RespondusAPI#SelectServerItem",
      "selectServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "clearState", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "PublishServerItem"),
      "urn:RespondusAPI#PublishServerItem",
      "publishServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemName", ["::SOAP::SOAPString"]],
        ["in", "uploadType", ["::SOAP::SOAPString"]],
        ["in", "fileName", ["::SOAP::SOAPString"]],
        ["in", "fileData", ["::SOAP::SOAPBase64"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "itemID", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "DeleteServerItem"),
      "urn:RespondusAPI#DeleteServerItem",
      "deleteServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "ReplaceServerItem"),
      "urn:RespondusAPI#ReplaceServerItem",
      "replaceServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "uploadType", ["::SOAP::SOAPString"]],
        ["in", "fileName", ["::SOAP::SOAPString"]],
        ["in", "fileData", ["::SOAP::SOAPBase64"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "RetrieveServerItem"),
      "urn:RespondusAPI#RetrieveServerItem",
      "retrieveServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "retrievalType", ["::SOAP::SOAPString"]],
        ["in", "options", ["::SOAP::SOAPString"]],
        ["in", "downloadType", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "fileName", ["::SOAP::SOAPString"]],
        ["out", "fileData", ["::SOAP::SOAPBase64"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "AppendServerItem"),
      "urn:RespondusAPI#AppendServerItem",
      "appendServerItem",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "uploadType", ["::SOAP::SOAPString"]],
        ["in", "fileName", ["::SOAP::SOAPString"]],
        ["in", "fileData", ["::SOAP::SOAPBase64"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "GetAttachmentLink"),
      "urn:RespondusAPI#GetAttachmentLink",
      "getAttachmentLink",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "fileName", ["::SOAP::SOAPString"]],
        ["in", "uploadType", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "linkPath", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "UploadAttachment"),
      "urn:RespondusAPI#UploadAttachment",
      "uploadAttachment",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "fileName", ["::SOAP::SOAPString"]],
        ["in", "fileData", ["::SOAP::SOAPBase64"]],
        ["in", "overwrite", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ],
    [ XSD::QName.new(NsRespondusAPI, "DownloadAttachment"),
      "urn:RespondusAPI#DownloadAttachment",
      "downloadAttachment",
      [ ["in", "userName", ["::SOAP::SOAPString"]],
        ["in", "password", ["::SOAP::SOAPString"]],
        ["in", "context", ["::SOAP::SOAPString"]],
        ["in", "itemType", ["::SOAP::SOAPString"]],
        ["in", "itemID", ["::SOAP::SOAPString"]],
        ["in", "linkPath", ["::SOAP::SOAPString"]],
        ["retval", "errorStatus", ["::SOAP::SOAPString"]],
        ["out", "serverStatus", ["::SOAP::SOAPString"]],
        ["out", "context", ["::SOAP::SOAPString"]],
        ["out", "fileName", ["::SOAP::SOAPString"]],
        ["out", "fileData", ["::SOAP::SOAPBase64"]] ],
      { :request_style =>  :rpc, :request_use =>  :encoded,
        :response_style => :rpc, :response_use => :encoded,
        :faults => {} }
    ]
  ]
end
end
