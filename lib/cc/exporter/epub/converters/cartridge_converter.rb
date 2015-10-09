module CC::Exporter::Epub::Converters
  class CartridgeConverter < Canvas::Migration::Migrator
    include CC::CCHelper
    include Canvas::Migration::XMLHelper
    include WikiEpubConverter
    include AssignmentEpubConverter
    include TopicEpubConverter
    include QuizEpubConverter
    include ModuleEpubConverter
    include FilesConverter
    include MediaConverter

    MANIFEST_FILE = "imsmanifest.xml"

    # settings will use these keys: :course_name, :base_download_dir
    def initialize(settings)
      super(settings, "cc")
      @course = @course.with_indifferent_access
      @resources = {}
      @resource_nodes_for_flat_manifest = {}
    end

    def convert_placeholder_paths_from_string!(html_string)
      html_node = Nokogiri::HTML::DocumentFragment.parse(html_string)
      html_node.tap do |node|
        convert_media_paths!(node)
        remove_empty_ids!(node)
      end
      html_node.to_s
    end

    def remove_empty_ids!(node)
      node.search("a[id='']").each do |tag|
        tag.remove_attribute('id')
      end
      node
    end

    # exports the package into the intermediary json
    def export
      unzip_archive
      set_progress(5)

      @manifest = open_file(File.join(@unzipped_file_path, MANIFEST_FILE))
      get_all_resources(@manifest)

      @course[:title] = get_node_val(@manifest, "string")
      @course[:files] = convert_files

      set_progress(10)
      @course[:wikis] = convert_wikis
      set_progress(20)
      @course[:assignments] = convert_assignments
      set_progress(30)
      @course[:topics] = convert_topics
      set_progress(40)
      @course[:quizzes] = convert_quizzes
      set_progress(50)
      @course[:modules] = convert_modules

      # close up shop
      save_to_file
      set_progress(90)
      delete_unzipped_archive
      @course
    end
  end
end
