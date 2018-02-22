DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE _posts MODIFY COLUMN eventTrigger ENUM('order-closed','new-order','order-completed','order-marked-as-done');
	
		UPDATE _posts SET targetUserType = 2 WHERE code = 'request-marked-as-done';
		UPDATE _posts SET eventTrigger = 'order-marked-as-done' WHERE code='request-marked-as-done';

	end;;
call doMigration();
