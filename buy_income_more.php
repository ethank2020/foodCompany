<!--
	##### 업데이트로그 #####
	2021.03.03 김현중 신규
-->
<input type = 'hidden' class = 'pk_type' id = 'pk_type' name ='pk_type' value='buorsu_uid'/>
<input type = 'hidden' class = 'pk_value' id = 'pk_value' name ='pk_value' value='<?php echo inputchk($_GET['uid'])?>'/>

<div class='group-print'>
	<div class='group-title'>거래처 정보</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>거래처</span>
			<span id='stac_nm' class='group-data' from='buy_order_sub' out='stac_uid' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>'  ref_from='stnd_account' ref_where='stac_uid' final_out='stac_nm' view-tag='html' individual='no'></span>
		</div>
	</div>
	<br />
	<div class='group-title'>입고예정 품목 정보</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>구매발주 명</span>
			<span id='buor_nm' class='group-data' from='buy_order_sub' out='buor_uid' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' ref_from='buy_order' ref_where='buor_uid' final_out='buor_nm' view-tag='html'></span>
		</div>
	</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>품목명</span>
			<span id='buorsu_nm' class='group-data' from='buy_order_sub' out='buorsu_nm' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' view-tag='html' placeholder='구매요청 이유를 입력하세요.'></span>
		</div>
	</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>품목 코드</span>
			<span id='buorsu_cd' class='group-data' from='buy_order_sub' out='buorsu_cd' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' view-tag='html''></span>
		</div>
	</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>품목 단가</span>
			<span id='buorsu_unitprice' class='group-data' from='buy_order_sub' out='buorsu_unitprice' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' view-tag='html'></span>
		</div>
	</div>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>입고완료일</span>
			<span id='buorsu_compdate' class='group-data' from='buy_order_sub' out='buorsu_compdate' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' view-tag='html' data-mask='yyyy-mm-dd hh24:mi:ss'></span>
		</div>
	</div>
	<br/>
	<div class='group'>
		<div class='group'>
			<span class='group-title'>입고예정 수량</span>
			<span id='buorsu_qty' class='group-data' from='buy_order_sub' out='buorsu_qty' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>'view-tag='html' data-mask='#,##0,00'></span>
		</div>
		<div class='group'>
			<span class='group-title'>입고완료 수량</span>
			<span id='buorsu_compqty' class='group-data' from='buy_order_sub' out='buorsu_compqty' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>'view-tag='html' data-mask='#,##0,00'></span>
		</div>
		<div class='group'>
			<span class='group-title'>총 금액</span>
			<span id='buorsu_tprice' class='group-data' from='buy_order_sub' out='buorsu_tprice' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>'view-tag='html' data-mask='₩ #,##0,00'></span>
		</div> 
	</div>
	<br />
	<div class='group'>
		<div class='group'>
			<span class='group-title'>등록자</span>
			<span id='buorsu_memuid' class='group-data' from='buy_order_sub' out='buorsu_memuid' where='buorsu_uid' find="<?php echo inputchk($_GET['uid']); ?>"  ref_from='stnd_member' final_out='stme_name' ref_where='stme_uid' view-tag='html'></span>
		</div>
		<div class='group'>
			<span class='group-title'>등록일</span>
			<span id='buorsu_regdate' class='group-data' from='buy_order_sub' out='buorsu_regdate' where='buorsu_uid' find='<?php echo inputchk($_GET['uid']); ?>' view-tag='html' data-mask='yyyy-mm-dd hh24:mi:ss'></span>
		</div>
	</div>
	<br />
</div>