DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE task MODIFY COLUMN currency ENUM('USD', 'CAD', 'PLN', 'HUF', 'EUR');
        
	end;;
    
call doMigration();