/*
	##### 업데이트로그 #####
	2021.03.03 김현중 신규
*/

$(function(){
	//jexcel 호출
	var select_function = table_columns[0].select_function;
	eval(select_function)();
	//바코드 사용
	barcode_scan();
	$('.display').css('display','block');
});

//바코드 설정
var barcode_scan_info ={
	//바코드 사용여부(Y/N)
	barcode_use : 'Y',
	//바코드 input 아이디 값
	barcode_input : 'barcode_input',
	//바코드 span 클래스 값
	barcode_span : 'barcode_span',
	//바코드 스캔 후 기능 <- 스캔한 데이터를 해당 함수 변수로 전송
	barcode_func : load_barcode_scan
};

//바코드 스캔 후 사용될 함수
function load_barcode_scan(scan_info){
	var select_option = [{'column':'stit_barcode', 'type':'=', 'data' : scan_info}];
	var barcode_data = select_common('stnd_item', '', '', '','','','','','',select_option);
	var barcode_condition = new Object;
	if(barcode_data[0].count > 0){
		var uid = barcode_data[1].stit_uid
		var nm = barcode_data[1].stit_nm
		barcode_condition =	{   
			'type':'=',
			'column':'stit_uid',
			'data' : uid
		}
		table_columns[0].select_condition = [];
		table_columns[0].select_condition.push(barcode_condition);
		console.log(table_columns[0].select_condition);
		var select_function = table_columns[0].select_function;
		eval(select_function)();
		$('span[id="barcode_status"]').html(nm);
	}else{
		alert('해당 품목 정보를 찾을 수 없습니다.');
		$('span[id="barcode_status"]').html('품목정보 없음');
		table_columns[0].select_condition = [];
		var select_function = table_columns[0].select_function;
		eval(select_function)();
	}
};

//입고등록 버튼
function update_item_nowqty(obj){
	var data = new Object();
	var data_y = $(obj).parent().attr('data-y');
	data.uid = $('[data-x = 0]','[data-y = '+data_y+']').text();

	var target_pagename = '/buy_income_input?uid='+data.uid+'&data_y='+data_y;
	var target_title = '입고 수량 입력';
	var option = 'width=1200, height=1200';
	var popup = window.open(target_pagename, target_title, option);
}

function change_jexcel_qty(data_y, status, qty){
	$('[data-x=9]','[data-y='+data_y+']').html(qty);
	if(status == '입고 완료'){
		$('[data-x=3]','[data-y='+data_y+']').empty();
		$('[data-x=3]','[data-y='+data_y+']').css('color', 'blue');
		$('[data-x=3]','[data-y='+data_y+']').html('입고 완료');
	}else if(status == '입고 진행'){
		$('[data-x=3]','[data-y='+data_y+']').empty();
		$('[data-x=3]','[data-y='+data_y+']').html('<button class="enter" onclick="update_item_nowqty(this);" style="height:20px;font-size:0.9em;font-weight:normal;width:10%;">입고 등록</button><button class="close" onclick="update_status_complete(this);" style="height:20px;font-size:0.9em;font-weight:normal;width:10%;">입고 종결</button>');
	}

}

//입고종결 버튼
function update_status_complete(obj){
	var check = confirm('입고 수량이 입고예정 수량보다 적습니다. 종결 하시겠습니까?');
	if(check == true){
		//입고품목 데이터DB 입고종결
		var item_data = new Array();
		var item_info = new Object();
		var data_y = $(obj).parent().attr('data-y');
		var end_uid = $('[data-x = 0]','[data-y = '+data_y+']').text();
		item_info.table = 'buy_order_sub';
		item_info.pk = 'buorsu_uid';
		item_info.buorsu_uid = end_uid;
		item_info.buorsu_status = '입고 완료';
		item_info.buorsu_compdate = 'millisecond_use';
		item_data.push(item_info);
		item_data = JSON.stringify(item_data);
		call_ajax('update_common', {'data':item_data}, function(){
		},false);

		//발주현황 데이터DB 업데이트
		var order_check = select_common('buy_order_sub','buorsu_uid',end_uid);
		var order_uid = order_check[1].buor_uid;
		var order_qty = order_check[1].buorsu_qty;
		var order_compqty = order_check[1].buorsu_compqty;
		var left_qty = Number(order_qty) - Number(order_compqty);
		var end_check = select_common('buy_order','buor_uid',order_uid);
		var complete_qty = end_check[1].buor_endqty;
		var update_qty = Number(complete_qty) + Number(left_qty); 
		console.log(left_qty);
		console.log(end_check);
		console.log(complete_qty);
		console.log(update_qty);
		var order_data = new Array();
		var order_info = new Object();
		order_info.table = 'buy_order';
		order_info.pk = 'buor_uid';
		order_info.buor_uid = order_uid;
		order_info.buor_endqty = update_qty;
		order_data.push(order_info);
		order_data = JSON.stringify(order_data);
		call_ajax('update_common', {'data':order_data}, function(){
		},false);
		var next_check = select_common('buy_order','buor_uid',order_uid);
		var next_endqty = next_check[1].buor_endqty;
		var next_qty = next_check[1].buor_qty;
		var check_qty = Number(next_qty) - Number(next_endqty);
		console.log(next_endqty);
		console.log(next_qty);
		console.log(check_qty);
		console.log(next_check);

		//발주현황 데이터DB 최종입고 종결처리
		if(check_qty <= 0){
			var end_data = new Array();
			var end_info = new Object();
			end_info.table = 'buy_order';
			end_info.pk = 'buor_uid';
			end_info.buor_uid = order_uid;
			end_info.buor_status = '입고 종결';
			end_info.buor_indate = 'millisecond_use';
			end_data.push(end_info);
			end_data = JSON.stringify(end_data);
			call_ajax('update_common', {'data':end_data}, function(){
			},false);
		}
		alert('해당 입고품목이 종결 처리 되었습니다.');
		$(obj).parent().empty();
		$('[data-x=3]','[data-y='+data_y+']').css('color','blue');
		$('[data-x=3]','[data-y='+data_y+']')[0].innerHTML='입고 완료';

	}
}


var table_columns = [
	{
		//jexcel이 적용될 div 이름
		div_id : 'spreadsheet',
		//DB 테이블 이름
		table_name : 'buy_order_sub',
		fk_name : '',
		//ajax url
		select_url : 'select_common',
		select_condition : [
			{'column':'buorsu_status', 'type':'!=', 'data': '입고 완료'}
		],
		select_order_column : 'buorsu_regdate',
		select_order_type:'asc',
		insert_url : 'insert_common',
		update_url : 'update_common',
		delete_url : 'delete_common',
		//function
		select_function : 'select_common_jexcel',
		insert_function : 'insert_common_jexcel',
		update_function : 'update_common_jexcel',
		delete_function : 'delete_common_function',
		//dropbox 용도
		//dropdown 용도
		dropdown_join : 'N',
		dropdown_config : [
		],

		//편의 기능
			//행 추가,삭제, 선택 삭제 버튼
			add_row_button : 'N',
			delete_row_button : 'N',
			selected_delete_button : 'N',
			//마우스 오른쪽 클릭 시 행 추가, 삭제
			add_row_click : 'N',
			delete_row_click : 'N',
			//검색, 페이지 설정
			search : 'Y',
			pagination : '20',
			pagination_option : [20,50,100,200],
			//자동업데이트
			autoTableUpdate : 'Y',
			autoTableInsert : 'N',
			//부분검색
			filter:'Y',
			date_search:'Y',
			date_column:'buorsu_regdate',
			date_month:'3'
	},
	//hidden에 pk값 넣을것
	//항상 첫번째에 pk값 넣을것
	//column에는 컬럼명 넣을것
	{
		type : 'pk',
		column: 'buorsu_uid'
	},
	{
		type : 'detail',
		xeicon : 'xi-document',
		width:'3%',
		//이동 URL
		url: './buy_income_more',
		//팝업창 이름
		pop_name : '입고품목 정보 상세보기',
		//팝업창 크기
		option : 'width = 1000, height = 1000',
		move_type : 'move_popup',
		title:'상세보기',
		column:'detail',
		readOnly:true
	},
	{
		type : 'hidden',
		column:'buorsu_status',
	},
	{
		type : 'condition',
		width:'15%',
		title:'입고 등록',
		column:'buorsu_status',
		condition_config :[
			{
				condition : 'value == "입고 예정"',
				result : '<button class="enter" onclick="update_item_nowqty(this);" style="display: block;height:20px;font-size:0.9em;font-weight:normal;width:100%;min-width:20px;">입고 등록</button>',
				color : ''
			},
			{
				condition : 'value == "입고 진행"',
				result : '<button class="enter" onclick="update_item_nowqty(this);" style="height:20px;font-size:0.9em;font-weight:normal;width:10%;">입고 등록</button><button class="close" onclick="update_status_complete(this);" style="height:20px;font-size:0.9em;font-weight:normal;width:10%;">입고 종결</button>',
				color : ''
			},
			{
				condition : 'value == "입고 완료"',
				result : '입고 완료',
				color : 'blue'
			},

		],
		readOnly:true
	},
	{
		type : 'calendar',
		options: { format:'YYYY-MM-DD HH24:MI:SS' },
		width:'9%',
		title:'입고완료일',
		column:'buorsu_compdate',
		readOnly:true
	},
	{
		type : 'text',
		width:'15%',
		title:'발주명',
		column: 'buor_uid',
		ref_column:{
			join_table : 'buy_order',
			join_pk : 'buor_uid',
			join_column : 'buor_nm'
		},
		readOnly:true
	},
		{
		type : 'text',
		width:'10%',
		title:'거래처',
		column: 'stac_uid',
		ref_column:{
			join_table : 'stnd_account',
			join_pk : 'stac_uid',
			join_column : 'stac_nm'
		},
		readOnly:true
	},
	{
		type : 'text',
		width:'8%',
		title:'품목명',
		column: 'buorsu_nm',
		readOnly:true
	},
	{
		type : 'text',
		width:'6%',
		title:'입고예정 수량',
		column: 'buorsu_qty',
		mask:'#,##.00',
		readOnly:true
	},
	{
		type : 'text',
		width:'6%',
		title:'입고완료 수량',
		mask:'#,##.00',
		column: 'buorsu_compqty',
		readOnly:true
	},
	{
		type : 'numeric',
		width:'6%',
		title:'총 금액',
		mask:'#,##.00',
		column: 'buorsu_tprice',
		readOnly:true
	},
	{
		type : 'text',
		width:'5%',
		title:'등록자',
		column: 'buorsu_memuid',
		ref_column:{
			join_table : 'stnd_member',
			join_pk : 'stme_uid',
			join_column : 'stme_name'
		},
		readOnly:true
	},
	{
		type : 'calendar',
		options: { format:'YYYY-MM-DD HH24:MI:SS' },
		width:'8%',
		title:'등록일',
		column:'buorsu_regdate',
		readOnly:true
	},
	{
		type : 'hidden',
		column:'stit_uid',
	},
];

