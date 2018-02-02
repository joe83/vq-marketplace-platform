DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;

		ALTER TABLE _appTaskCategory ADD COLUMN status ENUM('0', '103', '99');
        
	end;;
    
call doMigration();