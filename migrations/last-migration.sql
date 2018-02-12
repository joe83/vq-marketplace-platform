DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE task ADD COLUMN callToActionLabel VARCHAR(64);
        ALTER TABLE task ADD COLUMN callToActionUrl VARCHAR(254);
		ALTER TABLE request MODIFY COLUMN status ENUM('0','5','6','10','14','15','20','25');
		ALTER TABLE _appTaskCategory ADD COLUMN status ENUM('0', '103', '99');
		ALTER TABLE task MODIFY COLUMN status ENUM('0','10','20','30','99','103');
	end;;

call doMigration();