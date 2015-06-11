require 'minitest/autorun'
require 'autoextend'

describe Autoextend::ObjectMethods do
  before do
    module AutoextendSpec; end
  end

  after do
    Object.send(:remove_const, :AutoextendSpec)
    Autoextend.extensions.reject! { |k, _| k =~ /^AutoextendSpec::/ }
  end

  it "should autoextend a class afterwards" do
    module AutoextendSpec::MyExtension; end
    Autoextend.hook(:"AutoextendSpec::Class", :"AutoextendSpec::MyExtension")
    defined?(AutoextendSpec::Class).must_equal nil
    class AutoextendSpec::Class; end
    AutoextendSpec::Class.ancestors.must_include AutoextendSpec::MyExtension
  end

  it "should autoextend an already defined class" do
    class AutoextendSpec::Class; end
    module AutoextendSpec::MyExtension; end
    Autoextend.hook(:"AutoextendSpec::Class", :"AutoextendSpec::MyExtension")
    AutoextendSpec::Class.ancestors.must_include AutoextendSpec::MyExtension
  end

  it "should call a block" do
    called = 42
    Autoextend.hook(:"AutoextendSpec::Class") { AutoextendSpec::Class.instance_variable_set(:@called, called) }
    defined?(AutoextendSpec::Class).must_equal nil
    class AutoextendSpec::Class; end

    AutoextendSpec::Class.instance_variable_get(:@called).must_equal 42
  end
end
