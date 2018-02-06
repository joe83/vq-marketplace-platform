DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;

		ALTER TABLE request MODIFY COLUMN status ENUM('0','5','6','10','14','15','20','25');
        
	end;;
    
call doMigration();