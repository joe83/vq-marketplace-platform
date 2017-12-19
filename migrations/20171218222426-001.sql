DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		ALTER TABLE _appTaskCategory ADD COLUMN minQuantity FLOAT;
        ALTER TABLE _appTaskCategory ADD COLUMN maxQuantity FLOAT;
        ALTER TABLE _appTaskCategory ADD COLUMN quantityStep FLOAT;
        ALTER TABLE _appTaskCategory ADD COLUMN unitOfMeasure VARCHAR(10);
        ALTER TABLE task ADD COLUMN quantity FLOAT;
        ALTER TABLE task ADD COLUMN unitOfMeasure VARCHAR(10);
	end;;
    
call doMigration();