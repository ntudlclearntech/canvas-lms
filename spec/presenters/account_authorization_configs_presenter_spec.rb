require 'spec_helper'

describe AccountAuthorizationConfigsPresenter do
  describe "initialization" do
    it "wraps an account" do
      account = stub()
      presenter = described_class.new(account)
      expect(presenter.account).to eq(account)
    end
  end

  describe "#configs" do

    it "pulls configs from account" do
      config2 = stub
      account = stub(account_authorization_configs: [stub, config2])
      presenter = described_class.new(account)
      expect(presenter.configs[1]).to eq(config2)
    end

    it "wraps them in an array" do
      class NotArray < Array
      end
      account = stub(account_authorization_configs: NotArray.new([]))
      presenter = described_class.new(account)
      expect(presenter.configs.class).to eq(Array)
    end
  end

  describe "SAML view helpers" do
    let(:presenter){ described_class.new(stub) }

    describe "#saml_identifiers" do
      it "is empty when saml disabled" do
        AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(false)
        expect(presenter.saml_identifiers).to be_empty
      end

      it "is the list from Onelogin::Saml::NameIdentifiers" do
        AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(true)
        expected = Onelogin::Saml::NameIdentifiers::ALL_IDENTIFIERS
        expect(presenter.saml_identifiers).to eq(expected)
      end
    end

    describe "#saml_login_attributes" do
      it "is empty when saml disabled" do
        AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(false)
        expect(presenter.saml_login_attributes).to be_empty
      end

      it "pulls the attributes from AAC" do
        AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(true)
        expected = AccountAuthorizationConfig::SAML.login_attributes
        expect(presenter.saml_login_attributes).to eq(expected)
      end
    end

    describe "#saml_authn_contexts" do
      it "is empty when saml disabled" do
        AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(false)
        expect(presenter.saml_authn_contexts).to be_empty
      end

      context "when saml enabled" do

        before do
          AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(true)
        end

        it "has each value from Onelogin" do
          contexts = presenter.saml_authn_contexts
          Onelogin::Saml::AuthnContexts::ALL_CONTEXTS.each do |context|
            expect(contexts).to include(context)
          end
        end

        it "sorts OneLogin values" do
          contexts = presenter.saml_authn_contexts(['abc', 'xyz', 'bcd'])
          expect(contexts.index('bcd') < contexts.index('xyz')).to be(true)
        end

        it "adds in a nil value result" do
          contexts = presenter.saml_authn_contexts
          expect(contexts[0]).to eq(["No Value", nil])
        end
      end
    end
  end

  describe "#auth?" do
    it "is true for one aac" do
      account = stub(account_authorization_configs: [stub])
      presenter = described_class.new(account)
      expect(presenter.auth?).to be(true)
    end

    it "is true for many aacs" do
      account = stub(account_authorization_configs: [stub, stub])
      presenter = described_class.new(account)
      expect(presenter.auth?).to be(true)
    end

    it "is false for no aacs" do
      account = stub(account_authorization_configs: [])
      presenter = described_class.new(account)
      expect(presenter.auth?).to be(false)
    end
  end

  describe "#ldap_config?" do
    it "is true if theres at least one ldap aac" do
      account = stub(
        account_authorization_configs: [AccountAuthorizationConfig::LDAP.new]
      )
      presenter = described_class.new(account)
      expect(presenter.ldap_config?).to be(true)
    end

    it "is false for no aacs" do
      account = stub(account_authorization_configs: [])
      presenter = described_class.new(account)
      expect(presenter.ldap_config?).to be(false)
    end

    it "is false for aacs which are not ldap" do
      account = stub(
        account_authorization_configs: [
          stub(auth_type: 'saml'),
          stub(auth_type: 'cas')
        ]
      )
      presenter = described_class.new(account)
      expect(presenter.ldap_config?).to be(false)
    end
  end

  describe "#sso_options" do
    it "always has cas and ldap" do
      AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(false)
      presenter = described_class.new(stub)
      expect(presenter.sso_options).to eq([[:CAS, 'cas'], [:LDAP, 'ldap']])
    end

    it "includes saml if saml enabled" do
      AccountAuthorizationConfig::SAML.stubs(:enabled?).returns(true)
      presenter = described_class.new(stub)
      expect(presenter.sso_options).to include([:SAML, 'saml'])
    end
  end

  describe "ip_configuration" do
    def stub_setting(val)
      Setting.stubs(:get)
        .with('account_authorization_config_ip_addresses', nil)
        .returns(val)
    end

    describe "#ips_configured?" do
      it "is true if there is anything in the ip addresses setting" do
        stub_setting('127.0.0.1')
        presenter = described_class.new(stub)
        expect(presenter.ips_configured?).to be(true)
      end

      it "is false without ip addresses" do
        stub_setting(nil)
        presenter = described_class.new(stub)
        expect(presenter.ips_configured?).to be(false)
      end
    end

    describe "#ip_list" do
      it "just returns the one for one ip address" do
        stub_setting("127.0.0.1")
        presenter = described_class.new(stub)
        expect(presenter.ip_list).to eq("127.0.0.1")
      end

      it "combines many ips into a newline delimited block" do
        stub_setting("127.0.0.1,2.2.2.2, 4.4.4.4,  6.6.6.6")
        presenter = described_class.new(stub)
        list_output = "127.0.0.1\n2.2.2.2\n4.4.4.4\n6.6.6.6"
        expect(presenter.ip_list).to eq(list_output)
      end

      it "is an empty string for no ips" do
        stub_setting(nil)
        presenter = described_class.new(stub)
        expect(presenter.ip_list).to eq("")
      end
    end
  end

  describe "#canvas_auth_only?" do
    it "is true for canvas_auth" do
      account = stub(canvas_authentication?: true, ldap_authentication?: false)
      presenter = described_class.new(account)
      expect(presenter.canvas_auth_only?).to eq(true)
    end

    it "is false if ldap is also on" do
      account = stub(canvas_authentication?: true, ldap_authentication?: true)
      presenter = described_class.new(account)
      expect(presenter.canvas_auth_only?).to eq(false)
    end

    it "is false if canvas_auth is off" do
      account = stub(canvas_authentication?: false, ldap_authentication?: false)
      presenter = described_class.new(account)
      expect(presenter.canvas_auth_only?).to eq(false)
    end
  end

  describe "#form_id" do
    it "is auth_type_form for a new record" do
      config = AccountAuthorizationConfig::CAS.new
      form_id = described_class.new(stub).form_id(config)
      expect(form_id).to eq('cas_form')
    end

    it "is generalized for an existing config" do
      config = AccountAuthorizationConfig::LDAP.new
      config.stubs(:new_record?).returns(false)
      presenter = described_class.new(stub)
      expect(presenter.form_id(config)).to eq('auth_form')
    end
  end

  describe "#form_class" do
    it "is active for an existing config" do
      config = AccountAuthorizationConfig::SAML.new
      config.stubs(:new_record?).returns(false)
      presenter = described_class.new(stub)
      expect(presenter.form_class(config)).to eq('class="active"')
    end

    it "is blank for a new record" do
      cas_config = AccountAuthorizationConfig::CAS.new
      form_id = described_class.new(stub).form_class(cas_config)
      expect(form_id).to eq('')
    end
  end

  describe "#login_placeholder" do
    it "wraps AAC.default_delegated_login_handle_name" do
      expect(described_class.new(stub).login_placeholder).to eq(
        AccountAuthorizationConfig.default_delegated_login_handle_name
      )
    end
  end

  describe "#login_name" do
    let(:account){ Account.new }

    it "uses the one from the account if available" do
      account.login_handle_name = "LoginName"
      name = described_class.new(account).login_name
      expect(name).to eq("LoginName")
    end

    it "defaults to the provided default on AccountAuthorizationConfig" do
      name = described_class.new(account).login_name
      expect(name).to eq(AccountAuthorizationConfig.default_login_handle_name)
    end
  end

  describe "#ldap_configs" do
    it "selects out all ldap configs" do
      config = AccountAuthorizationConfig::LDAP.new
      config2 = AccountAuthorizationConfig::LDAP.new
      account = stub(account_authorization_configs: [stub, config, stub, config2])
      presenter = described_class.new(account)
      expect(presenter.ldap_configs).to eq([config, config2])
    end
  end

  describe "#saml_configs" do
    it "selects out all saml configs" do
      config = AccountAuthorizationConfig::SAML.new
      config2 = AccountAuthorizationConfig::SAML.new
      pre_configs = [stub, config, stub, config2]
      pre_configs.stubs(:scoped).returns(AccountAuthorizationConfig)
      account = stub(account_authorization_configs: pre_configs)
      configs = described_class.new(account).saml_configs
      expect(configs[0]).to eq(config)
      expect(configs[1]).to eq(config2)
      expect(configs.size).to eq(2)
    end
  end

  describe "#position_options" do
    let(:config){ AccountAuthorizationConfig::SAML.new }
    let(:configs){ [config, config, config, config] }
    let(:account){ stub(account_authorization_configs: configs) }

    before do
      configs.stubs(:scoped).returns(AccountAuthorizationConfig)
    end

    it "generates a list from the saml config size" do
      config.stubs(:new_record?).returns(false)
      options = described_class.new(account).position_options(config)
      expect(options).to eq([[1,1],[2,2],[3,3],[4,4]])
    end

    it "tags on the 'Last' option if this config is new" do
      options = described_class.new(account).position_options(config)
      expect(options).to eq([["Last",nil],[1,1],[2,2],[3,3],[4,4]])
    end
  end
end
