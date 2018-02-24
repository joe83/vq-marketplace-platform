DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE _posts MODIFY COLUMN eventTrigger ENUM('order-closed','new-order','order-completed','order-marked-as-done');
	
		UPDATE _posts SET targetUserType = 1 WHERE code = 'new-order';
		UPDATE _posts SET eventTrigger = 'new-order' WHERE code='new-order';

		UPDATE _posts SET targetUserType = 2 WHERE code = 'new-order-for-supply';
		UPDATE _posts SET eventTrigger = 'new-order' WHERE code='new-order-for-supply';
	end;;
call doMigration();
