/*
	##### 업데이트로그 #####
	2021.03.03 김현중 신규
*/

$(function(){
	//입고수량만 modi로 바꾸기
	$('#buorsu_compqty').html("<input id='buorsu_completeqty' type='text' data-mask='#,##0,00' placeholder='입고 수량을 입력하세요' />");
	$('#buorsu_compqty').append("<i class='star'>*</i>");

	$('.group_all_modify').css('display','none');
	if($('.group-bom').length > 0){
		var tree_id = $('.group-bom').attr('id');
		if(_GET('load') == 'true'){//bom 불러오기 용도
			window[tree_id] = new dhx.Tree(tree_id);
		}else{
			window[tree_id] = new dhx.Tree(tree_id,{
				dragMode:true,
				//checkbox: true,
				keyNavigation: true
			});
		}
		create_tree(window[tree_id]);
	}
});



var income_uid;
//tree 생성
function create_tree(tree_id){
	var tree_data = tree_id.data.serialize();
	if(tree_data.length>0){
		tree_id.data.remove(tree_data[0].id);
	}

	//창고 데이터 검색
	var wh_data = select_common('stnd_warehouse','','','','stwa_uid','asc');
	if(wh_data.length>1){
		var wh_array = new Array();
		wh_array = change_tree_type(wh_array, wh_data);
		tree_id.data.parse(wh_array);
		$('.dhx_grid').remove();
		//클릭 이벤트
		tree_id.events.on("ItemClick", function(id, e){
		var tree_data = tree_id.data.serialize();
		var tree_array = new Array();
		tree_array = tree_data_handling(tree_array, tree_data[0]);
		//해당 아이디의 창고 고유번호 찾기
		var wh_uid = '';
		$.each(tree_array,function(row, value){
        if(value.id == id){
			wh_uid = value.stwa_uid;
		}
		});

      //jexcel 호출
		
		table_columns[0].select_condition[2].data = wh_uid;
		var select_function = table_columns[0].select_function;
		eval(select_function)();
		$('#row_button_area').empty();
		$('#row_button_area').append('<button style = "color : white; background : #4B87DA; float : right" onclick = "income_operate();"> 입고 등록</button>');
		income_uid = wh_uid;
		});
	}

}

//하위 품목 찾기
function tree_data_handling(tree_array, tree_data, pid = ''){
  var child_info = new Object();
  child_info.pid = pid;
	//본인 id
	if('id' in tree_data){
		child_info.id = tree_data.id;
	}else{
		child_info.id = '';
	}

	//uid 값 있는지 체크
	if('uid' in tree_data){
		child_info.stwa_uid = tree_data.uid;
	}

	child_info.value = tree_data.value;
	tree_array.push(child_info);

	//하위 품목 있는지 체크
	if('items' in tree_data){
		if(tree_data.items.length > 0){
			for(var item_row = 0; item_row < tree_data.items.length; item_row++){
				tree_array = tree_data_handling(tree_array, tree_data.items[item_row],tree_data.id);
			}
		}
	}

	return tree_array;
}

//select_common 으로 불러온 데이터를 트리형태로 변환

function change_tree_type(tree_data, data, puid = 0){
	for(var data_row = 1; data_row < data.length; data_row++){
		if(data[data_row].stwa_puid == puid){
			var tree_info = new Object();
			tree_info.opened = true;
			tree_info.value = data[data_row].stwa_nm;
			tree_info.uid = data[data_row].stwa_uid;
			tree_info.items = new Array();
			tree_info.items = change_tree_type(tree_info.items, data, data[data_row].stwa_uid);
			tree_data.push(tree_info);
		}
	}
	return tree_data;
}
//입고 등록
function income_operate(){
	var qty = $('#buorsu_qty').html().replace(/,/gi,'');
	var nowqty = $('#buorsu_completeqty').val().replace(/,/gi,'');
	var data = select_common('buy_order_sub','buorsu_uid',_GET('uid'));
	var order_uid = data[1].buor_uid;
	var item_uid = data[1].stit_uid;
	var compqty = data[1].buorsu_compqty;
	var left_qty = Number(qty) - Number(compqty); 
	var over_qty = Number(left_qty) - Number(nowqty); 
	var update_qty = Number(compqty) + Number(nowqty); 
	var buor_data = select_common('buy_order','buor_uid',order_uid);
	var order_compqty = buor_data[1].buor_compqty;
	var order_endqty = buor_data[1].buor_endqty;
	var order_update_qty = Number(order_compqty) + Number(nowqty); 
	var order_update_endqty = Number(order_endqty) + Number(nowqty); 
	//입고 수량 초과 확인	
//	if(over_qty >= 0){
		if(nowqty != '' && nowqty != 0){
			//입고 품목DB 업데이트
			var item_data = new Array();
			var item_info = new Object();
			item_info.table = 'buy_order_sub';
			item_info.pk = 'buorsu_uid';
			item_info.buorsu_uid = _GET('uid');
			item_info.buorsu_compqty = update_qty;
			item_info.buorsu_stwa_uid = income_uid;
			item_info.buorsu_status = '입고 진행';
			item_data.push(item_info);
			item_data = JSON.stringify(item_data);
			call_ajax('update_common', {'data':item_data}, function(){
			},false);

			//발주DB 업데이트
			var order_data = new Array();
			var order_info = new Object();
			order_info.table = 'buy_order';
			order_info.pk = 'buor_uid';
			order_info.buor_uid = order_uid;
			order_info.buor_compqty = order_update_qty;
			order_info.buor_endqty = order_update_endqty;
			order_info.buor_status = '입고 진행';
			order_data.push(order_info);
			order_data = JSON.stringify(order_data);
			call_ajax('update_common', {'data':order_data}, function(){
			},false);
			
			//재고DB 업데이트
			var data = select_common('buy_order_sub','buorsu_uid',_GET('uid'));
			var stok_data = new Array();
			var stok_info = new Object();
			stok_info.stit_uid = item_uid;
			stok_info.stwa_uid = income_uid;
			//재고 추가 품목이 g단위인지 확인
			var unit_data = select_common('stnd_item','stit_uid',item_uid);
			var unit_type = unit_data[1].stitun_uid;
			var unitnm_data = select_common('stnd_item_unit','stitun_uid',unit_type);
			var unit_type_nm = unitnm_data[1].stitun_nm;
			var unit_gram = unit_data[1].stit_gram;
			if(unit_type_nm == 'g'){
				nowqty = Number(nowqty)*Number(unit_gram);
				console.log(nowqty);
			}
			stok_info.qty = nowqty;
			stok_info.reason = '입고';
			stok_data.push(stok_info);
			call_ajax('update_stok_record', {'data':stok_data}, function(stok_json){
				if(stok_json.result == 'success'){
					alert('입고 정보가 등록되었습니다.');
					var check = select_common('buy_order_sub','buorsu_uid',_GET('uid'));
					var final_compqty = check[1].buorsu_compqty;
					var final_qty = check[1].buorsu_qty;
					var check_qty = Number(final_qty) - Number(final_compqty);
					var check_status = '입고 진행';
					//입고품목 전부 입고되었을 경우 상태 업데이트(사후처리)
					if(check_qty <= 0){
						var final_item_data = new Array();
						var final_item_info = new Object();
						final_item_info.table = 'buy_order_sub';
						final_item_info.pk = 'buorsu_uid';
						final_item_info.buorsu_uid = _GET('uid');
						final_item_info.buorsu_status = '입고 완료';
						final_item_info.buorsu_compdate = 'millisecond_use';
						final_item_data.push(final_item_info);
						final_item_data = JSON.stringify(final_item_data);
						call_ajax('update_common', {'data':final_item_data}, function(){
							check_status = '입고 완료';
						},false);
					}
					//발주량 전부 입고되었을 경우 상태 업데이트(사후처리)
					var check_data = select_common('buy_order','buor_uid',order_uid);
					var last_endqty = check_data[1].buor_endqty;
					var last_qty = check_data[1].buor_qty;
					var last_checkqty = Number(last_qty) - Number(last_endqty);
					console.log(last_checkqty);
					console.log(last_endqty);
					console.log(last_qty);
					if(last_checkqty <= 0){
						var last_item_data = new Array();
						var last_item_info = new Object();
						last_item_info.table = 'buy_order';
						last_item_info.pk = 'buor_uid';
						last_item_info.buor_uid = order_uid;
						last_item_info.buor_status = '입고 완료';
						last_item_info.buor_indate = 'millisecond_use';
						last_item_data.push(last_item_info);
						last_item_data = JSON.stringify(last_item_data);
						call_ajax('update_common', {'data':last_item_data}, function(){
						},false);
					}
					window.opener.change_jexcel_qty(_GET('data_y'), check_status, final_compqty);
					window.close();
				}else{
					alert('재고 정보 등록에 실패하였습니다. 관리자에게 문의해주세요.');
				}
			},false);
		}else{
			alert('입고 수량이 입력되지 않았습니다.');
			return false;
		}
		/*
	}else{
		alert('입고 수량이 예정수량보다 '+over_qty+'개 많습니다.');
		return false;
	}
	*/
}

//창고 수량 등록
/*
function change_input_qty(){
	stop_group_data = true;
	var jexcel_length = $('.jexcel tbody tr').length;
	var uid = _GET('uid');
	var prev_qty =  $('#buorsu_compqty').html().replace(/,/gi,'');
	var pre_qty = $('#buorsu_qty').html().replace(/,/gi,'');
	var order_data = new Array();
	var orderStatus_data = new Array();
	var log_data = new Array();
	var stok_data = new Array();
	var total_qty = 0;

	var sub_data = select_common('buy_order_sub','buorsu_uid',uid);
	if(sub_data.length>1){
		for(var row = 0; row < jexcel_length; row++){
			var stwa_uid = $('[data-x=2]','[data-y='+row+']').html();
			var qty = $('[data-x=3]','[data-y='+row+']').html().replace(/,/gi,'');
			var etc = $('[data-x=4]','[data-y='+row+']').html().replace(/,/gi,'');
			if(stwa_uid == ''){
				alert('창고를 선택해주세요.');
				return false;
			}

			if(qty == ''){
				alert('수량을 입력해주세요.');
				return false;
			}
			total_qty += Number(qty);
			//이력 정보
			var log_info = new Object();
			log_info.table = 'buy_input_item';
			log_info.pk = 'buinit_uid';
			log_info.buinit_uid = '';
			log_info.buor_uid = sub_data[1].buor_uid;
			log_info.buorsu_uid = sub_data[1].buorsu_uid;
			log_info.stit_uid = sub_data[1].stit_uid;
			log_info.stitpr_uid = sub_data[1].stitpr_uid;
			log_info.plsc_uid = sub_data[1].plsc_uid;
			log_info.stac_uid = sub_data[1].stac_uid;
			log_info.stwa_uid = stwa_uid;
			log_info.buinit_compledate = 'millisecond_use';
			log_info.buinit_totalqty = sub_data[1].buorsu_totalqty;
			log_info.buinit_nowqty = qty;
			log_info.buinit_etc = etc;
			log_info.buinit_memuid = '';
			log_info.buinit_regdate = '';
			log_data.push(log_info);

			var stok_info = new Object();
			stok_info.stit_uid = sub_data[1].stit_uid;
			stok_info.stwa_uid = stwa_uid;
			stok_info.qty = qty;
			stok_info.reason = '입고';
			stok_info.plsc_uid = sub_data[1].plsc_uid;
			stok_data.push(stok_info);

		}
		//발주 서브 테이블
		var order_info = new Object();
		order_info.table = 'buy_order_sub';
		order_info.pk = 'buorsu_uid';
		order_info.buorsu_uid = uid;
		order_info.buorsu_qty = Number(prev_qty) + Number(total_qty);
		var status = '';
		if(Number(pre_qty) <= Number(prev_qty) + Number(total_qty)){
			order_info.buorsu_status = '입고 완료';
			order_info.buorsu_compdate = 'millisecond_use';
			status = '입고 완료';
		}else{
			order_info.buorsu_status = '입고 진행';
			status = '입고 진행';
		}
		order_data.push(order_info);

		console.log('pre_qty: ' + pre_qty);
		console.log('prev_qty: ' + prev_qty);
		console.log('total_qty: ' + total_qty);

		//buy_order테이블 입고 수량 업데이트
		var order_status = new Object();
		order_status.table = 'buy_order';
		order_status.pk = 'buor_uid';
		order_status.buor_uid = uid;
		order_status.buor_qty = Number(prev_qty) + Number(total_qty);
		//var status = '';
		orderStatus_data.push(order_status);

		orderStatus_data = JSON.stringify(orderStatus_data);
		order_data = JSON.stringify(order_data);
		log_data = JSON.stringify(log_data);
		call_ajax('update_common', {'data':orderStatus_data}, function(json){
				if(json.result == 'success'){
			call_ajax('update_common', {'data':order_data}, function(json){
				if(json.result == 'success'){
					call_ajax('insert_common',{'data':log_data},function(log_json){
						if(log_json.result == 'success'){
							call_ajax('update_stok_record', {'data':stok_data}, function(stok_json){
								if(stok_json.result == 'success'){
									alert('입고 정보가 등록되었습니다.');
									window.opener.change_jexcel_qty(_GET('data_y'), status, qty);
									window.close();
								}else{
									alert('재고 정보 등록에 실패하였습니다. 관리자에게 문의해주세요.');
								}
							},false);
						}else{
							alert('이력 정보 등록에 실패하였습니다. 관리자에게 문의해주세요.');
						}
					},false);
				}else{
					alert('입고 수량 변경에 실패하였습니다. 관리자에게 문의해주세요.');
				}
			},false);
		}else{
				alert('입고 수량 변경에 실패하였습니다. 관리자에게 문의해주세요.');
			}
		},false);
	}
}
			*/
/*
var uid = _GET('uid');
var table_columns = [//품목 수정용
	{
		//jexcel이 적용될 div 이름
		div_id : 'spreadsheet',
		//DB 테이블 이름
		table_name : 'buy_order_sub',
		fk_name : '',
		//ajax url
		select_url : 'select_common',
		select_condition : [
			{'column':'buorsu_uid', 'type':'=', 'data': uid}
		],

		insert_url : 'insert_common',
		update_url : 'update_common',
		delete_url : 'delete_common',
		//function
		select_function : 'select_common_jexcel',
		insert_function : 'insert_common_jexcel',
		update_function : 'update_common_jexcel',
		delete_function : 'delete_common_function',

		//dropdown 용도
		dropdown_join : 'Y',
		dropdown_config : [
			{
				//DB 테이블
				join_table : 'stnd_warehouse',
				//dropdown에 보여줄 컬럼
				join_column : 'stwa_nm',
				//dropdown가 적용될 컬럼
				apply_column : 'stwa_uid',
				//변경 컬럼
				join_column_object : {
					'stwa_uid' : '2',
				},
				//적용시킬 함수 <-넘어오는 데이터 x축, y축, value
				dropdown_function : ''
			},
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
			search : 'N',
			pagination : '',
			pagination_option : '',
			//자동업데이트
			autoTableUpdate : 'N',
			autoTableInsert : 'N',
			//부분검색
			filter:'N'
	},
	//hidden에 pk값 넣을것
	//항상 첫번째에 pk값 넣을것
	//column에는 컬럼명 넣을것
	{
		type : 'pk',
		column:'buorsu_uid'
	},
	{
		type : 'dropdown',
		width:'15%',
		title:'창고',
		column:'stwa_uid',
		ref_column:{
			join_table : 'stnd_warehouse',
			join_pk : 'stwa_uid',
			join_column : 'stwa_nm'
		},
		autocomplete:true
	},
	{
		type : 'numeric',
		width:'15%',
		title:'수량',
		mask:'#,##.00',
		column:'buorsu_compqty',
	}
];
*/
var table_columns = [
    {
        //jexcel이 적용될 div 이름
        div_id : 'spreadsheet',
        //DB테이블 이름
        table_name : 'view_stok_record',
        fk_name : '',
        //ajax_url
        select_url : 'select_common',
        select_condition :[
          {'column': 'stre_status', 'data':'불량', 'type':'!=' },
          {'column': 'stre_status', 'data':'폐기', 'type':'!=' },
          {'column': 'stwa_uid', 'data':0, 'type':'=' }
        ],
        select_order_column: 'stre_uid',
        select_order_type : 'DESC',
        insert_url : 'insert_common',
        update_url : 'update_common',
        delete_url : 'delete_common',
        //function
        select_function : 'select_common_jexcel',
        insert_function : 'insert_common_jexcel',
        update_function : 'update_common_jexcel',
        delete_function : 'delete_common_jexcel',
        //dropbox 용도
        dropdown_join : 'N',
            //DB테이블
            join_table : '',
            //dropbox에 보여줄 컬럼
            join_column : '',
            //변경컬럼
            join_column_array : '',
            //적용 열
            join_row : '',
        //편의기능
        //행추가삭제선택삭제 버튼
        add_row_button : 'Y',
        delete_row_button : 'N',
        selected_delete_button : 'N',
        //마우스 오른쪽 클릭시 행추가삭제 버튼
        add_row_click : 'N',
        delete_row_click : 'N',
        //검색, 페이지
        search : 'Y',
        pagination : '20',
        pagination_option : [50,100,200],
        //자동업데이트
        autoTableUpdate : 'N',
        autoTableInsert : 'N',
        filter:'Y'
    },
    //hidden에 pk값넣을것
    //항상 첫번째에 pk값
    //column에는 컬럼명
    {
        type: 'pk',
        column : 'stre_uid'
    },
    {
      type:'hidden',
      column: 'stit_uid'
      //jexcel에서는 보이진 않지만 undefined로 칸 차지 중
    },
    {
      type:'hidden',
      column: 'stwa_uid'
    },
    {
      type:'hidden',
      column: 'stitpr_uid'
    },
    {
  		type : 'detail',
  		xeicon : 'xi-document',
  		width:'5%',
  		//이동 URL
  		url:'/stok_inventory_more',
  		//팝업창 이름
  		pop_name : '바코드 정보 조회',
  		//팝업창 크기
  		option : 'width = 800, height = 1000',
  		title:'상세보기',
  		column:'detail',
  		readOnly:true
  	},
    {
      type : 'text',
      column : 'stit_uid', //select_coommon, 컬럼명
      title : '품목코드',
      width : '20%',
      ref_column : {
    		join_table : 'stnd_item',
    		join_pk : 'stit_uid',
    		join_column : 'stit_cd'
      },
      readOnly : true
    },
    {
      type : 'text',
      column : 'stit_uid', //select_coommon, 컬럼명
      title : '품목명',
      width : '20%',
      ref_column : {
    		join_table : 'stnd_item',
    		join_pk : 'stit_uid',
    		join_column : 'stit_nm'
      },
      readOnly : true
    },
    {
      type : 'text',
      column : 'stre_afterstock',
      title : '재고수량',
      width : '10%',
      readOnly : true
    }
];
