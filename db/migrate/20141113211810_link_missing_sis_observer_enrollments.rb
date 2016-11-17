class LinkMissingSisObserverEnrollments < ActiveRecord::Migration[4.2]
  tag :postdeploy
  disable_ddl_transaction!

  def up
    DataFixup::LinkMissingSisObserverEnrollments.send_later_if_production(:run)
  end

  def down
  end
end
