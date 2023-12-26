module CoolRoutes
  def self.extended(router)
    router.instance_exec do
      scope module: :cool do
        namespace :api do
          namespace :v1 do
            resources :courses, only: [] do
              scope module: :courses do
                resources :enrollments, only: [] do
                  member do
                    put 'set_override_score'
                  end
                end
              end
            end
          end
        end
      end
    end
  end
end
