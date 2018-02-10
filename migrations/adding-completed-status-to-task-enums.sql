DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;

		ALTER TABLE task MODIFY COLUMN status ENUM('0','10','20','30','99','103');
        
	end;;
    
call doMigration();