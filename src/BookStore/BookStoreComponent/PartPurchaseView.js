import React, {useState} from 'react';
import {Alert, View, Text, useWindowDimensions, StyleSheet, Image, Pressable, FlatList, ScrollView} from 'react-native';
import { responsiveFontSize, responsiveScreenFontSize, responsiveScreenHeight, responsiveScreenWidth } from 'react-native-responsive-dimensions';
import { TextInput, TouchableOpacity } from 'react-native-gesture-handler';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/FontAwesome';
import IconFeather from 'react-native-vector-icons/Feather';
import CheckBox from '@react-native-community/checkbox';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageModal } from '../../Common/CommonComponent/ImageModal';
import axios from 'axios';
import { HS_API_END_POINT } from '../../Shared/env';
const styles = StyleSheet.create({
    PartPurchaseViewStyle: {
        width: '90%',
        
        backgroundColor: 'white',
        borderRadius: 15,
        display: 'flex',
        flexDirection: 'row'
    },

    PartPurchaseLeftView: {
        width: '40%',
        height: '100%',
       // borderRightWidth: 1,
      //  borderWidth:1,
        alignItems: 'center',
        padding: 20
    },

    PartPurchaseRightView: {
        width: '60%',
        height: '100%',
        padding: 20,
       //backgroundColor: 'black'


    },

    BookTitleTextStyle: {
        fontSize: responsiveScreenFontSize(1.2),
        marginTop: '10%'
    },


    TocFieldViewStyle : {
        display: 'flex',
        flexDirection: 'row',
      //  borderWidth: 1,
        alignContent: 'space-between',
        marginVertical: 10,

        alignItems: 'center'
    }

})


const unTick = (data) => {

    data.tick = false;
    parent(data.parent);
    if(data.childs){
        data.childs.map(
            (item)=> {
                unTick(item);
            }
        )
      
    }
        
}

const parent = (data) => {
    if(data && data.childs) {
        const countNotCheckedItem = data.childs.filter(child => !child.tick);

        if(countNotCheckedItem.length === 0){
            data.tick = true;
        }else {
            data.tick = false;
        }
        parent(data.parent);
    }
}

const onTick = (data) => {
    data.tick = true;
    parent(data.parent);
    if(data.childs){
        data.childs.map(
            (item) => {
                onTick(item);
            }
        )
        
    }
}


const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
    if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
            return;
        }
        seen.add(value);
    }
    return value;
    };
};

function PartPurchaseView({navigation, selectedBook}) {
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const {width, height} = useWindowDimensions();
    const [text, setText] = useState("");
    const [pagesToBuy,setPagesToBuy] = useState({});
    const [pageArr, setPageArr] = useState([]);
    const [byToc, setByToc] = useState(true);
    const [reload, setReload] = useState(Math.random());
    const [price ,setPrice] = useState(0);
    const [bookTocData, setBookTocData] = useState([]);

    const base64Image = 'data:image/png;base64,' + selectedBook.bookCoverResource;
    let resursivePrice = 0;
    const priceCheck = (data) => {
        data.map(item=> {
            if(item.tick) {
                const priceOverhead = parseInt((item.endPage- item.startPage + 1) / selectedBook.pdfPageCount * selectedBook.price);
                resursivePrice = resursivePrice + priceOverhead;
               
            } else {
                if(item.childs) {
                    priceCheck(item.childs)
                }
              
            }
        })    
    }

    const purchaseButtonOnClick = () => {
        const formData = new FormData();

        let bookPurchaseDto = {
            //'name': 'me',
            'bookToc': bookTocData
        }

        formData.append('bookPurchaseStr', JSON.stringify(bookPurchaseDto, getCircularReplacer()));

        axios.post(`${HS_API_END_POINT}/book-purchase/pdf-book/` + selectedBook.id, formData)
        .then((res) => console.log(res))
        .catch((err)=> console.log(err));

    }

    const HierarchyDataRender = (item, index) => {

        if (!item.tick) {
            item.tick = false;
        }
 
        return(
            <View style={{marginLeft: 20}}  key={item.shopId}>            
                <View>
                                
                    <View style={styles.TocFieldViewStyle}>
                            {item.childs ? 

                                <Icon name="chevron-right" size={15} style={{
                                    marginRight: 12
                                }}/> : 
                                <Icon name="circle" size={15} style={{
                                    marginRight: 12}}
                                />}
                                <CheckBox
                                    boxType='square'
                                    style={{
                                        marginRight: 10,
                                        width: 20,
                                        height: 20
                                    }}
                                    animationDuration={0.4}
                                    onAnimationType='fade'
                                    offAnimationType='fade'
                                    value={item.tick}
                                    onValueChange={()=> {
                                       const priceOverhead = parseInt((item.endPage- item.startPage) / selectedBook.pdfPageCount * selectedBook.price);
  
                                        if(!item.tick) {
                                      
                                            onTick(item);
                                            setReload(Math.random())
                                        }else {
                                  
                                            unTick(item); 
                                            setReload(Math.random())
                                        }
                                        resursivePrice = 0;
                                        priceCheck(bookTocData);
                                        setPrice(resursivePrice);

                                    }} />
                                        
                            <View style={{
                                width: '90%',
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',

                            }}>
                                <Text 
                                    numberOfLines={1}
                                    style={{
                                    fontSize: responsiveScreenFontSize(1),
                                    width: '82%'
  
                                }} >{item.text}</Text>
                                <Text style={{
                                    textAlign: 'center',
                                    width: '18%',
                                    fontSize: responsiveScreenFontSize(0.8),
                                    position: 'absolute',
                                    right: 0
                                }}>
                                    {item.startPage}
                                </Text>
                            </View>
                        </View>
    
                        {item.childs && item.childs.map(
                            (data, index) => {
                                if(!data.parent) {
                                    data.parent = item;
                                }
                                return HierarchyDataRender(data, index);
                            }
                        ) }
    
                    </View>
                          
            </View>
        );
    }



    const sellByPage = () => setByToc(false);
    const sellByToc = () => {
        setByToc(true);
        setPagesToBuy("");
    }
    const onChangeText = (select) => setText(select);

    const savePage = async(toSave) => {
        await AsyncStorage.setItem("@pagesBuy",JSON.stringify(toSave));
    }
    const delPage = (key) =>{
        const newPages = {...pagesToBuy};

        const delValue = newPages[key].text;
        let newPageArr = [...pageArr];
        console.log("delValue : "+delValue);
        const inputs = delValue.split(',').map(x => x.trim());
        console.log("inputs: "+inputs);
        for(const x of inputs) {
            const pages = x.split('-');
            if(pages.length===1){
                const idx = newPageArr.indexOf(pages);
                newPageArr.splice(idx,1);
                //newPageArr = newPageArr.filter((element) => element !== pages);
            } else {
                for(var i = Number(pages[0]); i<=Number(pages[1]);i++){
                    const idx = newPageArr.indexOf(String(i));
                    newPageArr.splice(idx,1);
                    //newPageArr = newPageArr.filter((element) => element !== String(i));
                }
            }
        }
        console.log("newPageArr: "+ newPageArr);
        setPageArr(newPageArr);

        delete newPages[key];
        setPagesToBuy(newPages);
    }
    const isNumeric = input => !isNaN(input) // you may also check if the value is a nonzero positive integer
    const isOrdered = (start, end) => parseInt(start) < parseInt(end)
    const isRangeValid = range => range.length == 2 && range.every(isNumeric) && isOrdered(range[0], range[1])
    const isSingleValid = single => single.length == 1 && isNumeric(single[0])

    const isValidPage = (input) => {
        const inputs = input.split(',').map(x => x.trim());
        for(const x of inputs) {
            if(!x){
                Alert.alert(
                    "알맞은 형태로 입력해주세요!"
                );
                return false;
            } 
            const pages = x.split('-');

            if (x==='0'){
                Alert.alert(
                    "유효하지 않은 페이지 숫자입니다."
                );
                setText("");
                return false;
            } else if (!isSingleValid(pages) && !isRangeValid(pages)){
                Alert.alert(
                    "알맞은 형태로 입력해주세요!",
                    "ex 6,7,8,10-15"
                );
                setText("");
                return false;
            }
        }
        return true;
    }
    const isDuplicatePage = (input) => {
        const inputs = input.split(',').map(x => x.trim());
        var tf=true;
        for(const x of inputs) {
            const pages = x.split('-');
            // console.log("isDuplicatePage pages: " + pages);
            if(pages.length===1){
                if(pageArr.includes(pages[0])){
                    console.log("두번뜨나????");
                    Alert.alert(pages[0]+" 는 이미 포함되어있습니다!");
                    setText("");
                    return false;
                }
            } else {
                for(var i = Number(pages[0]); i<=Number(pages[1]);i++){
                    if(pageArr.includes(String(i))){
                        console.log("두번뜨나?");
                        Alert.alert(i+" 는 이미 포함되어있습니다!");
                        setText("");
                        return false;
                    }
                }
            }
        }
        return true;
    }
    const addPage = () => {
        console.log("pageArr:",pageArr);
        const inputs = text.split(',').map(x => x.trim());
        if(isValidPage(text)){ // 결과가 true 일때만 저장하는건데 -> true일때는 유효한 페이지형태 입력일 경우.
            //여기서 이제 페이지가 포함되어있는지를 체크해줘야한다.
            // setPageArr([]);
            //console.log(isDuplicatePage(text));
            if(isDuplicatePage(text)){ // true 일때 -> 중복이 아닐경우
                var temp=[];
                for(const x of inputs) {
                    const pages = x.split('-');
                    if (pages.length===1) {
                        temp = temp.concat(pages);
                    } else{
                        for(var i = Number(pages[0]); i<=Number(pages[1]);i++){
                            temp = temp.concat(String(i));
                        }
                    }
                }
                console.log("temp:",temp);
                const newPageArr = [...temp, ...pageArr];
                setPageArr(newPageArr);

                //페이지가 포함되어있지 않으면 저장
                const newPages = {
                    ...pagesToBuy, 
                    [Date.now()]: {text},
                };
                setPagesToBuy(newPages);
            }

        }

        setText("");
    }

    React.useEffect(()=> {
        axios.get(`${HS_API_END_POINT}/book-purchase/book-toc/` + selectedBook.id)
            .then((res)=> {
                setBookTocData(res.data.data);
            })
            .catch((err)=> console.log(err));
    },[])



    return (
        <View style={[
            styles.PartPurchaseViewStyle,
            {
                height:  width > height ? '100%' : '60%',
                
            }
        ]}>
                     
        
            <View style={styles.PartPurchaseLeftView}>
                <Text style={styles.BookTitleTextStyle}> {selectedBook.name}</Text>

                <Pressable onPress={()=> setImageModalVisible(true)} style={{marginTop: '10%'}}> 
                          
                    <Image
                        resizeMode='cover'
                        style={{
                            height: width > height ? responsiveScreenHeight(45): responsiveScreenWidth(40),
                            width:  width > height ? responsiveScreenWidth(24): responsiveScreenHeight(20),
                            borderWidth: 1,
                            borderColor: '#C2C2C2'
                
                            
                        }}
                        source={{
                            uri: base64Image
                        }}
                    
                    ></Image>
                </Pressable>
                <Text style={{
                    fontSize: responsiveScreenFontSize(1),
                    marginVertical: 5
                }}> 미리보기 </Text>
          
                
               
            </View>
 
                    
            <View style={styles.PartPurchaseRightView}>
                {/* if (byToc){ */}
                {byToc &&
                    <View 
                        isVisible={byToc}
                        style={{
                        height: '100%',
                        borderWidth: 1,
                        borderRadius: 15
                    }}>
                        <View style={{
                            height: '80%',
                        // borderWidth: 1
                        }}>
                           
                            
                                <FlatList
                                    data={bookTocData}
                                    renderItem={({item,index})=> HierarchyDataRender(item, index)}
                                    keyExtractor={(item,index)=> item.id.toString()}
                                >
                                    
                                </FlatList>
                            
                    
                        </View>
                        <View style={{
                            backgroundColor: '#ABAAAA', 
                            height: '20%', 
                            borderTopWidth: 1,
                            borderBottomLeftRadius: 15,
                            borderBottomRightRadius: 15,
                            justifyContent: 'center',
                
                        }}>
                            <View style={{
                                display: 'flex',
                                flexDirection: width > height ? 'column': 'column',
                                paddingHorizontal: 15,
                          
                                justifyContent: 'center',
                                height: '50%',
                                width: '100%'
                            }}>
                                <Text 
                                    numberOfLines={1}
                                    style={{
                                        fontSize: width > height ? responsiveScreenFontSize(2.2) : responsiveScreenFontSize(1.7),
                                        width: '70%',       
                                }}>
                                    {price.toLocaleString("ko-KR", { style: 'currency', currency: 'KRW' })}
                                </Text>
                                <Pressable style={{
                                
                                }}>
                                    <Text 
                                    style={{
                                        color: '#256EDE',
                                        fontWeight: '500'
                                    }}
                                    onPress={sellByPage}
                                    >
                                        페이지 단위로 구매하기
                                    </Text>
                                </Pressable>
                                <Pressable style={({pressed}) => [
                                    {
                                        backgroundColor: pressed ? '#1440F9' : 'black',
                                    }, 
                                    {
                                    borderRadius: 10,
                            
                                    width: responsiveScreenWidth(13),
                                    height: '80%',
                                    position: 'absolute',
                                    alignItems: 'center',
                                    right: 5,
                                    justifyContent: 'center',
                                    }
                                ]}
                                    onPress={()=> {
                                        if(price == 0) 
                                            alert('선택한 항목이 없습니다.');
                                        else {
                                            purchaseButtonOnClick();
                                        }
                                    }}>
        
                                    
                                <Text 
                                    style={{
                                        fontSize: responsiveScreenFontSize(1),
                                        color: 'white'
                                }}>구매하기</Text>
                
                                </Pressable>
                            </View>
                        </View>
                    </View>
                }
                {/* ㅍㅔ이지별로 구매하기 */}
                {!byToc &&
                    <View 
                    isVisible={byToc}
                    style={{
                    height: '100%',
                    borderWidth: 1,
                    borderRadius: 15
                    }}>
                    <View style={{
                        height: '80%',
                    // borderWidth: 1
                    }}>
                        <View style={{
                        height: '10%',
                        marginHorizontal:'5%',
                        marginTop:'5%',
                        justifyContent:'center',
                        // borderWidth: 1
                        }}>
                            <Text style={{
                                fontSize:responsiveScreenFontSize(1),
                                textAlign:'center',
                                }}>
                                구매하고자 하는 페이지를 입력해주세요.
                            </Text>
                        </View>
                        <View
                            style={{
                                flex:1,
                                justifyContent:'center',
                                alignContent:'center',
                                flexDirection:'row'
                                }}
                        >
                            <View style={{flex:4, justifyContent:'center'}}>
                                <TextInput 
                                    style={{
                                    margin:10,
                                    height: '40%',
                                    width:'95%',
                                    borderWidth: 1,
                                    borderRadius: 15,
                                    paddingLeft:10,
                                    }}
                                    onChangeText={onChangeText}
                                    value={text}
                                    onSubmitEditing={addPage}
                                    placeholder=" ex 6,7,8,10-15"
                                >
                                </TextInput>
                            </View>

                            <View style={{flex:1,justifyContent:'center'}}>
                                <Pressable style={({pressed}) => [
                                    {
                                        backgroundColor: !pressed ? '#1440F9' : 'black',
                                    }, 
                                    {
                                        margin:5,
                                        height: '40%',
                                        width:'80%',
                                        borderWidth: 1,
                                        borderRadius: 20,
                                        justifyContent:'center',
                                        //backgroundColor:'#1440F9',
                                    }
                                    ]}
                                    onPress={addPage}
                                >
                                    <Text 
                                        style={{
                                            textAlign:'center',
                                            fontSize: responsiveScreenFontSize(1),
                                            color: 'white',
                                            fontWeight:'800'
                                    }}>담기</Text>
                                </Pressable>
                            </View>
                        </View>
                        <View style={{flex:4}}>
                            <ScrollView>
                                {Object.keys(pagesToBuy).map((key) => (
                                <View 
                                key={key}
                                style={{
                                    flexDirection:'row',
                                    margin:5,
                                    padding:10,
                                    paddingLeft:15,
                                    backgroundColor:`#dcdcdc`,
                                    // borderColor:'black',
                                    // borderWidth:1,
                                    borderRadius:10,
                                    alignItems:'center',
                                    justifyContent:'space-between'
                                    
                                }}
                                >
                                    <Text style={{
                                        fontWeight:'500',
                                        fontSize:responsiveFontSize(0.9),
                                    }}>{pagesToBuy[key].text}</Text>
                                    <TouchableOpacity onPress={() => delPage(key)}>
                                        <IconFeather name="x-square" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                                ))}
                            </ScrollView>



                        </View>
                
                    </View>
                    <View style={{
                        backgroundColor: '#ABAAAA', 
                        height: '20%', 
                        borderTopWidth: 1,
                        borderBottomLeftRadius: 15,
                        borderBottomRightRadius: 15,
                        justifyContent: 'center',
            
                    }}>
                        <View style={{
                            display: 'flex',
                            flexDirection: width > height ? 'row': 'column',
                            paddingHorizontal: 15,
                            alignItems: width > height ? 'center' : null,
                            justifyContent: width > height ? null : 'center',
                            height: '50%',
                            width: '100%',
                        }}>
                            <Text style={{
                                fontSize: width > height ? responsiveScreenFontSize(2.2) : responsiveScreenFontSize(1.7),
                            
                                width: '30%',
                                    
                            }}>
                                8,730₩
                            </Text>
                            <Pressable style={{
                            
                            }}>
                                <Text 
                                style={{
                                    color: '#256EDE',
                                    fontWeight: '500'
                                }}
                                onPress={sellByToc}
                                >
                                    목차 단위로 구매하기
                                </Text>
                            </Pressable>
                            <Pressable style={({pressed}) => [
                                {
                                    backgroundColor: pressed ? '#1440F9' : 'black',
                                }, 
                                {
                                borderRadius: 5,
                        
                                width: responsiveScreenWidth(13),
                                height: '80%',
                                position: 'absolute',
                                alignItems: 'center',
                                right: 5,
                                justifyContent: 'center',
                                }
                            ]}
                                onPress={()=> {
                                    alert('구매하기 ㅎㅎ');
                                }}>

                                
                            <Text 
                                style={{
                                    fontSize: responsiveScreenFontSize(1),
                                    color: 'white'
                            }}>구매하기</Text>
            
                            </Pressable>
                        </View>
                    </View>
                </View>
                              
                }
               
            </View>
     
            <ImageModal imageModalVisible={imageModalVisible}
                        setImageModalVisible={setImageModalVisible}
                        base64Image={base64Image} />
        </View>
    );
}

export default PartPurchaseView;


