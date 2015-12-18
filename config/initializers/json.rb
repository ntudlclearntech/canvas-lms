if CANVAS_RAILS4_0
  ActiveSupport::JSON.backend = :oj
  MultiJson.dump_options = {:escape_mode => :xss_safe}

  # Rails4 gives an option to opt out of encoding BigDecimal json as a string
  if ActiveSupport.respond_to?(:encode_big_decimal_as_string)
    ActiveSupport.encode_big_decimal_as_string = false

  # Rails3 changes BigDecimal #to_json to encode as a string. This breaks
  # bw-compat in our apis, so this switches it back to the native behavior.
  else
    require 'bigdecimal'

    class BigDecimal
      def as_json(options = nil)
        if finite?
          self
        else
          NilClass::AS_JSON
        end
      end
    end
  end
else
  require 'json/jwt'
  require 'oj_mimic_json' # have to load after json/jwt or else the oj_mimic_json will make it never load
end