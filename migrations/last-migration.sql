DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE task ADD COLUMN intervalUnit INTEGER;
	end;;

call doMigration();