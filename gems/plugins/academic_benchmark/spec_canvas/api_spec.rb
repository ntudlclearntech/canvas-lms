#
# Copyright (C) 2012 - present Instructure, Inc.
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

require File.expand_path(File.dirname(__FILE__) + '/spec_helper')

describe AcademicBenchmark::Api do

  before do
    @api = AcademicBenchmark::Api.new("oioioi", :base_url => "http://example.com/")

    @level_0_browse = File.join(File.dirname(__FILE__) + '/fixtures', 'example.json')
    @authority_list = File.join(File.dirname(__FILE__) + '/fixtures', 'auth_list.json')
  end

  def mock_api_call(code, body, url)
    response = double()
    allow(response).to receive(:body).and_return(body)
    allow(response).to receive(:code).and_return(code.to_s)
    expect(AcademicBenchmark::Api).to receive(:get_url).with(url).and_return(response)
  end

  it "should fail with bad AB response" do
    mock_api_call(200,
                  %{{"status":"fail","ab_err":{"msg":"API key access violation.","code":"401"}}},
                  "http://example.com/browse?api_key=oioioi&format=json&levels=2")

    expect {
      @api.list_available_authorities
    }.to raise_error(AcademicBenchmark::APIError)
  end

  it "should fail with http error code" do
    mock_api_call(500,
                  '',
                  "http://example.com/browse?api_key=oioioi&format=json&levels=2")

    expect {
      @api.list_available_authorities
    }.to raise_error(AcademicBenchmark::APIError)
  end

  it "should get authority" do
    mock_api_call(200,
                  '{"status":"ok", "itm":[{"test":"yep"}]}',
                  "http://example.com/browse?api_key=oioioi&authority=CC&format=json&levels=0")
    expect(@api.browse_authority("CC", :levels => 0)).to eq [{"test" => "yep"}]
  end

  it "should get guid" do
    mock_api_call(200,
                  '{"status":"ok", "itm":[{"test":"yep"}]}',
                  "http://example.com/browse?api_key=oioioi&format=json&guid=gggggg&levels=0")
    expect(@api.browse_guid("gggggg", :levels => 0)).to eq [{"test" => "yep"}]
  end

  it "should get available authorities" do
    mock_api_call(200,
                  File.read(@authority_list),
                  "http://example.com/browse?api_key=oioioi&format=json&levels=2")

    expect(@api.list_available_authorities).to eq [{"chld" => "1", "guid" => "AAA", "title" => "NGA Center/CCSSO", "type" => "authority"},
                                               {"chld" => "2", "guid" => "CCC", "title" => "South Carolina", "type" => "authority"},
                                               {"chld" => "3", "guid" => "BBB", "title" => "Louisiana", "type" => "authority"},
                                               {"chld" => "2", "guid" => "111", "title" => "Good Standards", "type" => "authority"},
                                               {"chld" => "3", "guid" => "222", "title" => "Bad Standards", "type" => "authority"}]
  end
end
