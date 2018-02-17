DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE request ADD COLUMN intervalStart INTEGER;
		ALTER TABLE request ADD COLUMN intervalEnd INTEGER;
		ALTER TABLE request ADD COLUMN quantity INTEGER;
	end;;

call doMigration();