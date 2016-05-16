require_relative "common_helper_methods/custom_wait_methods"

module CustomSeleniumRspecMatchers

  class HasClass
    def initialize(class_name)
      @class_name = class_name
    end

    def matches?(element)
      @element = element
      !!@element.attribute('class').match(@class_name)
    end

    def failure_message
      "expected #{@element.inspect} to have class #{@class_name}, actual class names: #{@element.attribute('class')}"
    end

    def failure_message_when_negated
      "expected #{@element.inspect} to NOT have class #{@class_name}, actual class names: #{@element.attribute('class')}"
    end
  end

  def have_class(class_name)
    HasClass.new(class_name)
  end

  class IncludeText
    include CustomWaitMethods

    def initialize(text)
      @text = text
    end

    def matches?(element)
      raise "`include_text` can only be used on an element; use `include` if you're checking if one string includes another" if element.is_a?(String)
      raise "`include_text` will wait for you; don't nest it in `keep_trying_until`" if @__in_keep_trying_until
      @element = element
      keep_trying_until do
        @element_text = @element.text
        @element_text.include?(@text)
      end
    end

    def does_not_match?(element)
      raise "`include_text` can only be used on an element; use `include` if you're checking if one string includes another" if element.is_a?(String)
      raise "`include_text` will wait for you; don't nest it in `keep_trying_until`" if @__in_keep_trying_until
      @element = element
      keep_trying_until do
        @element_text = @element.text
        !@element_text.include?(@text)
      end
    end

    def failure_message
      "expected #{@element.inspect} text to include #{@text}, actual text was: #{@element_text}"
    end

    def failure_message_when_negated
      "expected #{@element.inspect} text to NOT include #{@text}, actual text was: #{@element_text}"
    end
  end

  def include_text(text)
    IncludeText.new(text)
  end

  class HasValue
    def initialize(value)
      @value_attribute = value
    end

    def matches? (element)
      @element = element
      !!@element.attribute('value').match(@value_attribute)
    end

    def failure_message
      "expected #{@element.inspect} to have value #{@value_attribute}, actual class names: #{@element.attribute('value')}"
    end

    def failure_message_when_negated
      "expected #{@element.inspect} to NOT have value #{@value_attribute}, actual value names: #{@element.attribute('value')}"
    end
  end

  def have_value(value)
    HasValue.new(value)
  end

  class HasAttribute
    def initialize(attribute, value)
      @attribute = attribute
      @attribute_value = value
    end

    def matches? (element)
      @element = element
      !!@element.attribute(@attribute).match(@attribute_value)
    end

    def failure_message
      "expected #{@element.inspect} to have attribute #{@attribute_value}, actual attribute type: #{@element.attribute('#{@attribute.to_s}')}"
    end

    def failure_message_when_negated
      "expected #{@element.inspect} to NOT have attribute #{@attribute_value}, actual attribute type: #{@element.attribute('#{@attribute.to_s}')}"
    end
  end

  def have_attribute(attribute, value)
    HasAttribute.new(attribute, value)
  end
end
