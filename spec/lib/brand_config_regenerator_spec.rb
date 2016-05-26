require File.expand_path(File.dirname(__FILE__) + '/../spec_helper.rb')
require 'delayed/testing'

describe BrandConfigRegenerator do
  def setup_account_family_with_configs
    @parent_account = Account.default
    @parent_account.enable_feature!(:use_new_styles)
    @parent_account.brand_config = @parent_config = BrandConfig.for(variables: {"ic-brand-primary" => "red"})
    @parent_config.save!
    @parent_account.save!
    @parent_shared_config = @parent_account.shared_brand_configs.create!(
      name: 'parent theme',
      brand_config_md5: @parent_config.md5
    )
    
    
    @child_account = Account.create!(parent_account: @parent_account, name: 'child')
    @child_account.brand_config = @child_config = BrandConfig.for(variables: {"ic-brand-global-nav-bgd" => "white"}, parent_md5: @parent_config.md5)
    @child_config.save!
    @child_account.save!
    @child_shared_config = @child_account.shared_brand_configs.create!(
      name: 'child theme',
      brand_config_md5: @child_config.md5
    )

    @grand_child_account = Account.create!(parent_account: @child_account, name: 'grand_child')
    @grand_child_account.brand_config = @grand_child_config = BrandConfig.for(variables: {"ic-brand-global-nav-avatar-border" => "blue"}, parent_md5: @child_config.md5)
    @grand_child_config.save!
    @grand_child_account.save!
    @grand_child_shared_config = @grand_child_account.shared_brand_configs.create!(
      name: 'grandchild theme',
      brand_config_md5: @grand_child_config.md5
    )
  end

  it "generates the right child brand configs and SharedBrandConfigs within subaccounts" do
    setup_account_family_with_configs

    second_config = BrandConfig.for(variables: {"ic-brand-primary" => "orange"}, parent_md5: @child_config.md5)
    second_config.save!
    @second_shared_config = @grand_child_account.shared_brand_configs.create!(
      name: 'second theme',
      brand_config_md5: second_config.md5
    )

    new_brand_config = BrandConfig.for(variables: {"ic-brand-primary" => "green"})
    regenerator = BrandConfigRegenerator.new(@parent_account, user, new_brand_config)

    brandable_css_stub = BrandableCSS.stubs(:compile_brand!).times(5)
    Delayed::Testing.drain
    expect(brandable_css_stub).to be_verified
    expect(regenerator.progresses.count).to eq(5)

    # make sure the child account's brand config is based on this new brand config
    expect(@child_account.reload.brand_config.parent).to eq(new_brand_config)
    # make sure the shared brand configs in the child accout are all based this new config
    expect(@child_shared_config.reload.brand_config.parent).to eq(new_brand_config)
    # make sure the child'd active theme still is the same as it's SharedBrandConfig named 'child theme'
    expect(@child_shared_config.brand_config).to eq(@child_account.brand_config)

    # make sure the same for the grandchild account.
    # (that all of it's configs point to the new one made for the child account)
    expect(@grand_child_account.reload.brand_config.parent).to eq(@child_account.brand_config)
    expect(@grand_child_shared_config.reload.brand_config.parent).to eq(@child_account.brand_config)
    expect(@grand_child_shared_config.brand_config).to eq(@grand_child_account.brand_config)

    # check the extra SavedBrandConfig in the grandchild to make sure it got regerated too
    expect(@second_shared_config.reload.brand_config.parent).to eq(@child_account.brand_config)
  end

end