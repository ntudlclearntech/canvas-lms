module CC::Exporter::Epub
  class Exporter

    include CC::Exporter::Epub::ModuleSorter

    RESOURCE_TITLES = {
      syllabus: "Syllabus",
      modules: "Modules",
      assignments: "Assignments",
      topics: "Discussion Topics",
      quizzes: "Quizzes",
      pages: "Wiki Pages"
    }.freeze

    LINKED_RESOURCE_KEY = {
      "Assignment" => :assignments,
      "DiscussionTopic" => :topics,
      "Quizzes::Quiz" => :quizzes,
      "WikiPage" => :pages
    }.freeze

    def initialize(cartridge, sort_by_content=false)
      @cartridge = cartridge
      @sort_by_content = sort_by_content || cartridge_json[:modules].empty?
    end
    attr_reader :cartridge, :sort_by_content
    delegate :unsupported_files, to: :cartridge_converter, allow_nil: true

    def cartridge_json
      @_cartridge_json ||= cartridge_converter.export
    end

    def templates
      @_templates ||= {
        title: cartridge_json[:title],
        files: cartridge_json[:files]
      }.tap do |hash|
        resources = filter_syllabus_for_modules ? module_ids : LINKED_RESOURCE_KEY.values
        hash.merge!(:syllabus => create_syllabus)
        resources.each do |resource_type|
          hash.merge!(resource_type => create_template(resource_type))
        end
      end
    end

    def get_item(resource_type, identifier)
      return {} unless cartridge_json[resource_type].present?
      cartridge_json[resource_type].find(-> { return {} }) do |resource|
        resource[:identifier] == identifier
      end
    end

    def update_item(resource_type, identifier, updated_item)
      get_item(resource_type, identifier).merge!(updated_item)
    end

    def create_syllabus
      syllabus_content = cartridge_json[:syllabus]
      syllabus_template = Exporter.resource_template(:syllabus)
      Template.new({resources: syllabus_content, reference: :syllabus}, syllabus_template, self)
    end

    def create_template(resource)
      resource_items = sort_by_content ? cartridge_json[resource] : filter_content_to_module(resource)
      Template.new({resources: resource_items, reference: resource}, base_template, self)
    end

    def base_template
      if sort_by_content
        "../templates/content_sorting_template.html.erb"
      else
        "../templates/module_sorting_template.html.erb"
      end
    end

    def self.resource_template(resource)
      "../templates/#{resource}_template.html.erb"
    end

    private
    def cartridge_converter
      @_cartridge_converter ||= Converters::CartridgeConverter.new({
        archive_file: cartridge
      })
    end
  end
end
