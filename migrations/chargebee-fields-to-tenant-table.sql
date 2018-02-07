		
DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE tenant ADD COLUMN chargebeeCustomerId VARCHAR(255);
        ALTER TABLE tenant ADD COLUMN chargebeeActiveSubscriptionId VARCHAR(255);
	end;;
    
call doMigration();