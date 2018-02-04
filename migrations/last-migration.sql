DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE task ADD COLUMN callToActionLabel VARCHAR(64);
        ALTER TABLE task ADD COLUMN callToActionUrl VARCHAR(254);
	end;;
    
call doMigration();