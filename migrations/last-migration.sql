DROP PROCEDURE IF EXISTS doMigration;

delimiter ;;
create procedure doMigration ()
	begin
		declare continue handler for 1060 begin end;
		UPDATE _posts SET body='<p>Hello!</p> <p><br></p> <p>There is a new booking for your listing "<%- LISTING_TITLE %>". See more information here:</p> <p><br></p> <p>&lt;%-ACTION_URL%&gt;</p> <p><br></p> <p>Best regards,</p> <p><%- CONFIG.NAME %> team</p>' WHERE code = 'new-order-for-supply';

	end;;

call doMigration();