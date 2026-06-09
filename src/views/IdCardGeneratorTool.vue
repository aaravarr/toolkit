<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import ToolCard from '../components/ToolCard.vue'
import CopyButton from '../components/CopyButton.vue'
import CustomSelect from '../components/CustomSelect.vue'
import { Fingerprint, RefreshCw, Settings2, List, FileJson, Table } from 'lucide-vue-next'

// ===== 地区数据 =====
const regionData: Record<string, Record<string, string[]>> = {
  '北京市': {
    '北京市': ['东城区', '西城区', '朝阳区', '丰台区', '海淀区', '石景山区', '通州区', '顺义区', '昌平区', '大兴区']
  },
  '上海市': {
    '上海市': ['黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', '杨浦区', '浦东新区', '闵行区', '宝山区']
  },
  '天津市': {
    '天津市': ['和平区', '河东区', '河西区', '南开区', '河北区', '红桥区', '东丽区', '西青区', '津南区', '北辰区', '武清区', '宝坻区', '滨海新区']
  },
  '重庆市': {
    '重庆市': ['万州区', '涪陵区', '渝中区', '大渡口区', '江北区', '沙坪坝区', '九龙坡区', '南岸区', '北碚区', '渝北区', '巴南区', '长寿区', '江津区', '合川区', '永川区', '南川区', '璧山区', '铜梁区', '潼南区', '荣昌区', '开州区', '梁平区', '武隆区']
  },
  '河北省': {
    '石家庄市': ['长安区', '桥西区', '新华区', '裕华区', '井陉矿区', '藁城区', '鹿泉区', '栾城区'],
    '唐山市': ['路南区', '路北区', '古冶区', '开平区', '丰南区', '丰润区', '曹妃甸区'],
    '保定市': ['竞秀区', '莲池区', '满城区', '清苑区', '徐水区'],
  },
  '山西省': {
    '太原市': ['小店区', '迎泽区', '杏花岭区', '尖草坪区', '万柏林区', '晋源区'],
    '大同市': ['新荣区', '平城区', '云冈区', '云州区'],
  },
  '内蒙古自治区': {
    '呼和浩特市': ['新城区', '回民区', '玉泉区', '赛罕区'],
    '包头市': ['东河区', '昆都仑区', '青山区', '石拐区', '白云鄂博矿区', '九原区'],
  },
  '辽宁省': {
    '沈阳市': ['和平区', '沈河区', '大东区', '皇姑区', '铁西区', '苏家屯区', '浑南区', '沈北新区', '于洪区'],
    '大连市': ['中山区', '西岗区', '沙河口区', '甘井子区', '旅顺口区', '金州区'],
    '鞍山市': ['铁东区', '铁西区', '立山区', '千山区'],
  },
  '吉林省': {
    '长春市': ['南关区', '宽城区', '朝阳区', '二道区', '绿园区', '双阳区', '九台区'],
    '吉林市': ['昌邑区', '龙潭区', '船营区', '丰满区'],
  },
  '黑龙江省': {
    '哈尔滨市': ['道里区', '南岗区', '道外区', '平房区', '松北区', '香坊区', '呼兰区', '阿城区', '双城区'],
    '齐齐哈尔市': ['龙沙区', '建华区', '铁锋区', '昂昂溪区', '富拉尔基区', '碾子山区'],
  },
  '江苏省': {
    '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区', '浦口区', '栖霞区', '雨花台区', '江宁区'],
    '苏州市': ['姑苏区', '虎丘区', '吴中区', '相城区', '吴江区'],
    '无锡市': ['梁溪区', '锡山区', '惠山区', '滨湖区', '新吴区'],
    '常州市': ['天宁区', '钟楼区', '新北区', '武进区', '金坛区'],
    '南通市': ['崇川区', '通州区', '海门区'],
  },
  '浙江省': {
    '杭州市': ['上城区', '拱墅区', '西湖区', '滨江区', '萧山区', '余杭区', '富阳区', '临安区'],
    '宁波市': ['海曙区', '江北区', '北仑区', '鄞州区', '镇海区', '奉化区'],
    '温州市': ['鹿城区', '龙湾区', '瓯海区', '洞头区'],
    '嘉兴市': ['南湖区', '秀洲区'],
    '湖州市': ['吴兴区', '南浔区'],
    '绍兴市': ['越城区', '柯桥区', '上虞区'],
    '金华市': ['婺城区', '金东区'],
  },
  '安徽省': {
    '合肥市': ['瑶海区', '庐阳区', '蜀山区', '包河区'],
    '芜湖市': ['镜湖区', '鸠江区', '弋江区', '湾沚区', '繁昌区'],
    '蚌埠市': ['龙子湖区', '蚌山区', '禹会区', '淮上区'],
  },
  '福建省': {
    '福州市': ['鼓楼区', '台江区', '仓山区', '马尾区', '晋安区', '长乐区'],
    '厦门市': ['思明区', '海沧区', '湖里区', '集美区', '同安区', '翔安区'],
    '泉州市': ['鲤城区', '丰泽区', '洛江区', '泉港区'],
  },
  '江西省': {
    '南昌市': ['东湖区', '西湖区', '青云谱区', '青山湖区', '新建区', '红谷滩区'],
    '景德镇市': ['昌江区', '珠山区', '浮梁县'],
    '赣州市': ['章贡区', '南康区', '赣县区'],
  },
  '山东省': {
    '济南市': ['历下区', '市中区', '槐荫区', '天桥区', '历城区', '长清区'],
    '青岛市': ['市南区', '市北区', '黄岛区', '崂山区', '李沧区', '城阳区'],
    '淄博市': ['淄川区', '张店区', '博山区', '临淄区', '周村区'],
    '烟台市': ['芝罘区', '福山区', '牟平区', '莱山区'],
    '潍坊市': ['潍城区', '寒亭区', '坊子区', '奎文区'],
    '临沂市': ['兰山区', '罗庄区', '河东区'],
  },
  '河南省': {
    '郑州市': ['中原区', '二七区', '管城回族区', '金水区', '上街区', '惠济区'],
    '洛阳市': ['老城区', '西工区', '瀍河回族区', '涧西区', '吉利区', '洛龙区'],
    '开封市': ['龙亭区', '顺河回族区', '鼓楼区', '禹王台区', '祥符区'],
  },
  '湖北省': {
    '武汉市': ['江岸区', '江汉区', '硚口区', '汉阳区', '武昌区', '青山区', '洪山区', '东西湖区', '蔡甸区', '江夏区'],
    '宜昌市': ['西陵区', '伍家岗区', '点军区', '猇亭区', '夷陵区'],
    '襄阳市': ['襄城区', '樊城区', '襄州区'],
  },
  '湖南省': {
    '长沙市': ['芙蓉区', '天心区', '岳麓区', '开福区', '雨花区', '望城区'],
    '株洲市': ['荷塘区', '芦淞区', '石峰区', '天元区', '渌口区'],
    '湘潭市': ['雨湖区', '岳塘区'],
  },
  '广东省': {
    '广州市': ['越秀区', '海珠区', '荔湾区', '天河区', '白云区', '黄埔区', '番禺区', '花都区', '南沙区'],
    '深圳市': ['罗湖区', '福田区', '南山区', '宝安区', '龙岗区', '盐田区', '龙华区', '坪山区', '光明区'],
    '东莞市': ['莞城街道', '南城街道', '东城街道', '万江街道'],
    '佛山市': ['禅城区', '南海区', '顺德区', '三水区', '高明区'],
    '珠海市': ['香洲区', '金湾区', '斗门区'],
    '惠州市': ['惠城区', '惠阳区'],
    '中山市': ['石岐街道', '东区街道', '西区街道', '南区街道'],
  },
  '广西壮族自治区': {
    '南宁市': ['兴宁区', '青秀区', '江南区', '西乡塘区', '良庆区', '邕宁区'],
    '柳州市': ['城中区', '鱼峰区', '柳南区', '柳北区', '柳江区'],
    '桂林市': ['秀峰区', '叠彩区', '象山区', '七星区', '雁山区', '临桂区'],
  },
  '海南省': {
    '海口市': ['秀英区', '龙华区', '琼山区', '美兰区'],
    '三亚市': ['海棠区', '吉阳区', '天涯区', '崖州区'],
  },
  '四川省': {
    '成都市': ['锦江区', '青羊区', '金牛区', '武侯区', '成华区', '龙泉驿区', '青白江区', '新都区', '温江区', '双流区'],
    '绵阳市': ['涪城区', '游仙区', '安州区'],
    '德阳市': ['旌阳区', '罗江区'],
    '宜宾市': ['翠屏区', '南溪区', '叙州区'],
  },
  '贵州省': {
    '贵阳市': ['南明区', '云岩区', '花溪区', '乌当区', '白云区', '观山湖区'],
    '遵义市': ['红花岗区', '汇川区', '播州区'],
  },
  '云南省': {
    '昆明市': ['五华区', '盘龙区', '官渡区', '西山区', '东川区', '呈贡区'],
    '曲靖市': ['麒麟区', '沾益区', '马龙区'],
    '大理白族自治州': ['大理市'],
  },
  '西藏自治区': {
    '拉萨市': ['城关区', '堆龙德庆区', '达孜区'],
  },
  '陕西省': {
    '西安市': ['新城区', '碑林区', '莲湖区', '灞桥区', '未央区', '雁塔区', '阎良区', '临潼区', '长安区', '高陵区', '鄠邑区'],
    '咸阳市': ['秦都区', '杨陵区', '渭城区'],
    '宝鸡市': ['渭滨区', '金台区', '陈仓区'],
  },
  '甘肃省': {
    '兰州市': ['城关区', '七里河区', '西固区', '安宁区', '红古区'],
    '天水市': ['秦州区', '麦积区'],
  },
  '青海省': {
    '西宁市': ['城东区', '城中区', '城西区', '城北区'],
  },
  '宁夏回族自治区': {
    '银川市': ['兴庆区', '西夏区', '金凤区'],
  },
  '新疆维吾尔自治区': {
    '乌鲁木齐市': ['天山区', '沙依巴克区', '新市区', '水磨沟区', '头屯河区', '达坂城区', '米东区'],
  },
}

// ===== 真实地区码映射 =====
const regionCodeMap: Record<string, Record<string, Record<string, string>>> = {
  '北京市': {
    '北京市': { '东城区': '110101', '西城区': '110102', '朝阳区': '110105', '丰台区': '110106', '海淀区': '110108', '石景山区': '110107', '通州区': '110112', '顺义区': '110113', '昌平区': '110114', '大兴区': '110115' }
  },
  '上海市': {
    '上海市': { '黄浦区': '310101', '徐汇区': '310104', '长宁区': '310105', '静安区': '310106', '普陀区': '310107', '虹口区': '310109', '杨浦区': '310110', '浦东新区': '310115', '闵行区': '310112', '宝山区': '310113' }
  },
  '天津市': {
    '天津市': { '和平区': '120101', '河东区': '120102', '河西区': '120103', '南开区': '120104', '河北区': '120105', '红桥区': '120106', '东丽区': '120110', '西青区': '120111', '津南区': '120112', '北辰区': '120113', '武清区': '120114', '宝坻区': '120115', '滨海新区': '120116' }
  },
  '重庆市': {
    '重庆市': { '万州区': '500101', '涪陵区': '500102', '渝中区': '500103', '大渡口区': '500104', '江北区': '500105', '沙坪坝区': '500106', '九龙坡区': '500107', '南岸区': '500108', '北碚区': '500109', '渝北区': '500112', '巴南区': '500113', '长寿区': '500115', '江津区': '500116', '合川区': '500117', '永川区': '500118', '南川区': '500119', '璧山区': '500120', '铜梁区': '500151', '潼南区': '500152', '荣昌区': '500153', '开州区': '500154', '梁平区': '500155', '武隆区': '500156' }
  },
  '河北省': {
    '石家庄市': { '长安区': '130102', '桥西区': '130104', '新华区': '130105', '裕华区': '130108', '井陉矿区': '130107', '藁城区': '130109', '鹿泉区': '130110', '栾城区': '130111' },
    '唐山市': { '路南区': '130202', '路北区': '130203', '古冶区': '130204', '开平区': '130205', '丰南区': '130207', '丰润区': '130208', '曹妃甸区': '130209' },
    '保定市': { '竞秀区': '130602', '莲池区': '130606', '满城区': '130607', '清苑区': '130608', '徐水区': '130609' },
  },
  '山西省': {
    '太原市': { '小店区': '140105', '迎泽区': '140106', '杏花岭区': '140107', '尖草坪区': '140108', '万柏林区': '140109', '晋源区': '140110' },
    '大同市': { '新荣区': '140212', '平城区': '140213', '云冈区': '140214', '云州区': '140215' },
  },
  '内蒙古自治区': {
    '呼和浩特市': { '新城区': '150102', '回民区': '150103', '玉泉区': '150104', '赛罕区': '150105' },
    '包头市': { '东河区': '150202', '昆都仑区': '150203', '青山区': '150204', '石拐区': '150205', '白云鄂博矿区': '150206', '九原区': '150207' },
  },
  '辽宁省': {
    '沈阳市': { '和平区': '210102', '沈河区': '210103', '大东区': '210104', '皇姑区': '210105', '铁西区': '210106', '苏家屯区': '210111', '浑南区': '210112', '沈北新区': '210113', '于洪区': '210114' },
    '大连市': { '中山区': '210202', '西岗区': '210203', '沙河口区': '210204', '甘井子区': '210211', '旅顺口区': '210212', '金州区': '210213' },
    '鞍山市': { '铁东区': '210302', '铁西区': '210303', '立山区': '210304', '千山区': '210311' },
  },
  '吉林省': {
    '长春市': { '南关区': '220102', '宽城区': '220103', '朝阳区': '220104', '二道区': '220105', '绿园区': '220106', '双阳区': '220112', '九台区': '220113' },
    '吉林市': { '昌邑区': '220202', '龙潭区': '220203', '船营区': '220204', '丰满区': '220211' },
  },
  '黑龙江省': {
    '哈尔滨市': { '道里区': '230102', '南岗区': '230103', '道外区': '230104', '平房区': '230108', '松北区': '230109', '香坊区': '230110', '呼兰区': '230111', '阿城区': '230112', '双城区': '230113' },
    '齐齐哈尔市': { '龙沙区': '230202', '建华区': '230203', '铁锋区': '230204', '昂昂溪区': '230205', '富拉尔基区': '230206', '碾子山区': '230207' },
  },
  '江苏省': {
    '南京市': { '玄武区': '320102', '秦淮区': '320104', '建邺区': '320105', '鼓楼区': '320106', '浦口区': '320111', '栖霞区': '320113', '雨花台区': '320114', '江宁区': '320115' },
    '苏州市': { '姑苏区': '320508', '虎丘区': '320505', '吴中区': '320506', '相城区': '320507', '吴江区': '320509' },
    '无锡市': { '梁溪区': '320213', '锡山区': '320205', '惠山区': '320206', '滨湖区': '320211', '新吴区': '320214' },
    '常州市': { '天宁区': '320402', '钟楼区': '320404', '新北区': '320411', '武进区': '320412', '金坛区': '320413' },
    '南通市': { '崇川区': '320602', '通州区': '320612', '海门区': '320613' },
  },
  '浙江省': {
    '杭州市': { '上城区': '330102', '拱墅区': '330105', '西湖区': '330106', '滨江区': '330108', '萧山区': '330109', '余杭区': '330110', '富阳区': '330111', '临安区': '330112' },
    '宁波市': { '海曙区': '330203', '江北区': '330205', '北仑区': '330206', '鄞州区': '330212', '镇海区': '330211', '奉化区': '330213' },
    '温州市': { '鹿城区': '330302', '龙湾区': '330303', '瓯海区': '330304', '洞头区': '330305' },
    '嘉兴市': { '南湖区': '330402', '秀洲区': '330411' },
    '湖州市': { '吴兴区': '330502', '南浔区': '330503' },
    '绍兴市': { '越城区': '330602', '柯桥区': '330603', '上虞区': '330604' },
    '金华市': { '婺城区': '330702', '金东区': '330703' },
  },
  '安徽省': {
    '合肥市': { '瑶海区': '340102', '庐阳区': '340103', '蜀山区': '340104', '包河区': '340111' },
    '芜湖市': { '镜湖区': '340202', '鸠江区': '340207', '弋江区': '340203', '湾沚区': '340210', '繁昌区': '340222' },
    '蚌埠市': { '龙子湖区': '340302', '蚌山区': '340303', '禹会区': '340304', '淮上区': '340311' },
  },
  '福建省': {
    '福州市': { '鼓楼区': '350102', '台江区': '350103', '仓山区': '350104', '马尾区': '350105', '晋安区': '350111', '长乐区': '350112' },
    '厦门市': { '思明区': '350203', '海沧区': '350205', '湖里区': '350206', '集美区': '350211', '同安区': '350212', '翔安区': '350213' },
    '泉州市': { '鲤城区': '350502', '丰泽区': '350503', '洛江区': '350504', '泉港区': '350505' },
  },
  '江西省': {
    '南昌市': { '东湖区': '360102', '西湖区': '360103', '青云谱区': '360104', '青山湖区': '360111', '新建区': '360112', '红谷滩区': '360113' },
    '景德镇市': { '昌江区': '360202', '珠山区': '360203', '浮梁县': '360222' },
    '赣州市': { '章贡区': '360702', '南康区': '360703', '赣县区': '360704' },
  },
  '山东省': {
    '济南市': { '历下区': '370102', '市中区': '370103', '槐荫区': '370104', '天桥区': '370105', '历城区': '370112', '长清区': '370113' },
    '青岛市': { '市南区': '370202', '市北区': '370203', '黄岛区': '370211', '崂山区': '370212', '李沧区': '370213', '城阳区': '370214' },
    '淄博市': { '淄川区': '370302', '张店区': '370303', '博山区': '370304', '临淄区': '370305', '周村区': '370306' },
    '烟台市': { '芝罘区': '370602', '福山区': '370611', '牟平区': '370612', '莱山区': '370613' },
    '潍坊市': { '潍城区': '370702', '寒亭区': '370703', '坊子区': '370704', '奎文区': '370705' },
    '临沂市': { '兰山区': '371302', '罗庄区': '371311', '河东区': '371312' },
  },
  '河南省': {
    '郑州市': { '中原区': '410102', '二七区': '410103', '管城回族区': '410104', '金水区': '410105', '上街区': '410106', '惠济区': '410108' },
    '洛阳市': { '老城区': '410302', '西工区': '410303', '瀍河回族区': '410304', '涧西区': '410305', '吉利区': '410306', '洛龙区': '410311' },
    '开封市': { '龙亭区': '410202', '顺河回族区': '410203', '鼓楼区': '410204', '禹王台区': '410205', '祥符区': '410212' },
  },
  '湖北省': {
    '武汉市': { '江岸区': '420102', '江汉区': '420103', '硚口区': '420104', '汉阳区': '420105', '武昌区': '420106', '青山区': '420107', '洪山区': '420111', '东西湖区': '420112', '蔡甸区': '420114', '江夏区': '420115' },
    '宜昌市': { '西陵区': '420502', '伍家岗区': '420503', '点军区': '420504', '猇亭区': '420505', '夷陵区': '420506' },
    '襄阳市': { '襄城区': '420602', '樊城区': '420606', '襄州区': '420607' },
  },
  '湖南省': {
    '长沙市': { '芙蓉区': '430102', '天心区': '430103', '岳麓区': '430104', '开福区': '430105', '雨花区': '430111', '望城区': '430112' },
    '株洲市': { '荷塘区': '430202', '芦淞区': '430203', '石峰区': '430204', '天元区': '430211', '渌口区': '430212' },
    '湘潭市': { '雨湖区': '430302', '岳塘区': '430304' },
  },
  '广东省': {
    '广州市': { '越秀区': '440104', '海珠区': '440105', '荔湾区': '440103', '天河区': '440106', '白云区': '440111', '黄埔区': '440112', '番禺区': '440113', '花都区': '440114', '南沙区': '440115' },
    '深圳市': { '罗湖区': '440303', '福田区': '440304', '南山区': '440305', '宝安区': '440306', '龙岗区': '440307', '盐田区': '440308', '龙华区': '440309', '坪山区': '440310', '光明区': '440311' },
    '东莞市': { '莞城街道': '441901', '南城街道': '441902', '东城街道': '441903', '万江街道': '441904' },
    '佛山市': { '禅城区': '440604', '南海区': '440605', '顺德区': '440606', '三水区': '440607', '高明区': '440608' },
    '珠海市': { '香洲区': '440402', '金湾区': '440403', '斗门区': '440404' },
    '惠州市': { '惠城区': '441302', '惠阳区': '441303' },
    '中山市': { '石岐街道': '442001', '东区街道': '442002', '西区街道': '442003', '南区街道': '442004' },
  },
  '广西壮族自治区': {
    '南宁市': { '兴宁区': '450102', '青秀区': '450103', '江南区': '450105', '西乡塘区': '450107', '良庆区': '450108', '邕宁区': '450109' },
    '柳州市': { '城中区': '450202', '鱼峰区': '450203', '柳南区': '450204', '柳北区': '450205', '柳江区': '450206' },
    '桂林市': { '秀峰区': '450302', '叠彩区': '450303', '象山区': '450304', '七星区': '450305', '雁山区': '450311', '临桂区': '450312' },
  },
  '海南省': {
    '海口市': { '秀英区': '460105', '龙华区': '460106', '琼山区': '460107', '美兰区': '460108' },
    '三亚市': { '海棠区': '460202', '吉阳区': '460203', '天涯区': '460204', '崖州区': '460205' },
  },
  '四川省': {
    '成都市': { '锦江区': '510104', '青羊区': '510105', '金牛区': '510106', '武侯区': '510107', '成华区': '510108', '龙泉驿区': '510112', '青白江区': '510113', '新都区': '510114', '温江区': '510115', '双流区': '510116' },
    '绵阳市': { '涪城区': '510703', '游仙区': '510704', '安州区': '510705' },
    '德阳市': { '旌阳区': '510603', '罗江区': '510604' },
    '宜宾市': { '翠屏区': '511502', '南溪区': '511503', '叙州区': '511504' },
  },
  '贵州省': {
    '贵阳市': { '南明区': '520102', '云岩区': '520103', '花溪区': '520111', '乌当区': '520112', '白云区': '520113', '观山湖区': '520115' },
    '遵义市': { '红花岗区': '520302', '汇川区': '520303', '播州区': '520304' },
  },
  '云南省': {
    '昆明市': { '五华区': '530102', '盘龙区': '530103', '官渡区': '530111', '西山区': '530112', '东川区': '530113', '呈贡区': '530114' },
    '曲靖市': { '麒麟区': '530302', '沾益区': '530303', '马龙区': '530304' },
    '大理白族自治州': { '大理市': '532901' },
  },
  '西藏自治区': {
    '拉萨市': { '城关区': '540102', '堆龙德庆区': '540103', '达孜区': '540104' },
  },
  '陕西省': {
    '西安市': { '新城区': '610102', '碑林区': '610103', '莲湖区': '610104', '灞桥区': '610111', '未央区': '610112', '雁塔区': '610113', '阎良区': '610114', '临潼区': '610115', '长安区': '610116', '高陵区': '610117', '鄠邑区': '610118' },
    '咸阳市': { '秦都区': '610402', '杨陵区': '610403', '渭城区': '610404' },
    '宝鸡市': { '渭滨区': '610302', '金台区': '610303', '陈仓区': '610304' },
  },
  '甘肃省': {
    '兰州市': { '城关区': '620102', '七里河区': '620103', '西固区': '620104', '安宁区': '620105', '红古区': '620111' },
    '天水市': { '秦州区': '620502', '麦积区': '620503' },
  },
  '青海省': {
    '西宁市': { '城东区': '630102', '城中区': '630103', '城西区': '630104', '城北区': '630105' },
  },
  '宁夏回族自治区': {
    '银川市': { '兴庆区': '640104', '西夏区': '640105', '金凤区': '640106' },
  },
  '新疆维吾尔自治区': {
    '乌鲁木齐市': { '天山区': '650102', '沙依巴克区': '650103', '新市区': '650104', '水磨沟区': '650105', '头屯河区': '650106', '达坂城区': '650107', '米东区': '650109' },
  },
}

// ===== 校验码算法 =====
const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
const checksumMap = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

function calcChecksum(id17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * weights[i]
  }
  return checksumMap[sum % 11]
}

// ===== 工具函数 =====
function randomInt(min: number, max: number): number {
  const range = max - min + 1
  const array = new Uint32Array(1)
  crypto.getRandomValues(array)
  return min + (array[0] % range)
}

function randomPick<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)]
}

function randomDate(start: dayjs.Dayjs, end: dayjs.Dayjs): dayjs.Dayjs {
  const diff = end.diff(start, 'day')
  return start.add(randomInt(0, diff), 'day')
}

// ===== 配置选项 =====
type DateMode = 'specific' | 'age-range' | 'random'
type GenderOption = 'male' | 'female' | 'random'
type OutputFormat = 'default' | 'json' | 'detailed'

const provinces = Object.keys(regionData)
const selectedProvince = ref('')
const selectedCity = ref('')
const selectedDistrict = ref('')

const dateMode = ref<DateMode>('random')
const specificYear = ref(2000)
const specificMonth = ref(1)
const specificDay = ref(1)
const minAge = ref(18)
const maxAge = ref(60)
const genderOption = ref<GenderOption>('random')
const count = ref(10)
const outputFormat = ref<OutputFormat>('default')

// ===== 生成结果类型 =====
interface GeneratedId {
  id: string
  province: string
  city: string
  district: string
  birthDate: string
  gender: string
  age: number
}

const results = ref<GeneratedId[]>([])

// ===== 联动逻辑 =====
const cities = computed(() => {
  if (!selectedProvince.value) return []
  return Object.keys(regionData[selectedProvince.value] || {})
})

const districts = computed(() => {
  if (!selectedProvince.value || !selectedCity.value) return []
  return (regionData[selectedProvince.value] || {})[selectedCity.value] || []
})

watch(selectedProvince, () => {
  selectedCity.value = ''
  selectedDistrict.value = ''
})

watch(selectedCity, () => {
  selectedDistrict.value = ''
})

// ===== 获取地区码 =====
function getRegionCode(province: string, city: string, district: string): string {
  return regionCodeMap[province]?.[city]?.[district] || '110101'
}

// ===== 生成函数 =====
function generate() {
  const n = Math.max(1, Math.min(100, count.value))
  const today = dayjs()
  const list: GeneratedId[] = []

  for (let i = 0; i < n; i++) {
    // 确定地区
    let province = selectedProvince.value || randomPick(provinces)
    let citiesInProvince = Object.keys(regionData[province] || {})
    let city = selectedCity.value || randomPick(citiesInProvince)
    let districtsInCity = (regionData[province] || {})[city] || []
    let district = selectedDistrict.value || randomPick(districtsInCity)

    // 确保地区码有效
    const regionCode = getRegionCode(province, city, district)

    // 确定出生日期
    let birthDate: dayjs.Dayjs
    if (dateMode.value === 'specific') {
      birthDate = dayjs(`${specificYear.value}-${String(specificMonth.value).padStart(2, '0')}-${String(specificDay.value).padStart(2, '0')}`)
      if (!birthDate.isValid()) {
        birthDate = dayjs(`${specificYear.value}-${String(specificMonth.value).padStart(2, '0')}-01`)
      }
    } else if (dateMode.value === 'age-range') {
      const maxBirthDate = today.subtract(minAge.value, 'year')
      const minBirthDate = today.subtract(maxAge.value + 1, 'year').add(1, 'day')
      birthDate = randomDate(minBirthDate, maxBirthDate)
    } else {
      // random: 18-70 岁之间
      const maxBirthDate = today.subtract(18, 'year')
      const minBirthDate = today.subtract(70, 'year').add(1, 'day')
      birthDate = randomDate(minBirthDate, maxBirthDate)
    }

    const dateStr = birthDate.format('YYYYMMDD')

    // 确定性别（顺序码第3位：奇数=男，偶数=女）
    let gender: '男' | '女'
    let seqSuffix: number
    if (genderOption.value === 'male') {
      gender = '男'
      seqSuffix = randomInt(1, 4) * 2 - 1 // 1,3,5,7
    } else if (genderOption.value === 'female') {
      gender = '女'
      seqSuffix = randomInt(1, 4) * 2 // 2,4,6,8
    } else {
      gender = Math.random() < 0.5 ? '男' : '女'
      seqSuffix = randomInt(1, 9)
    }

    // 构建前17位
    const seqCode = String(randomInt(10, 99)) + String(seqSuffix)
    const id17 = regionCode + dateStr + seqCode
    const checksum = calcChecksum(id17)
    const fullId = id17 + checksum

    // 计算年龄
    let age = today.year() - birthDate.year()
    if (today.format('MMDD') < birthDate.format('MMDD')) {
      age--
    }

    list.push({
      id: fullId,
      province,
      city,
      district,
      birthDate: birthDate.format('YYYY-MM-DD'),
      gender,
      age,
    })
  }

  results.value = list
}

// ===== 统计信息 =====
const stats = computed(() => {
  const total = results.value.length
  const maleCount = results.value.filter(r => r.gender === '男').length
  const femaleCount = total - maleCount
  return { total, maleCount, femaleCount }
})

// ===== 输出文本 =====
const outputText = computed(() => {
  if (results.value.length === 0) return ''

  if (outputFormat.value === 'json') {
    return JSON.stringify(results.value.map(r => ({
      id: r.id,
      province: r.province,
      city: r.city,
      district: r.district,
      birthDate: r.birthDate,
      gender: r.gender,
      age: r.age,
    })), null, 2)
  }

  if (outputFormat.value === 'detailed') {
    return results.value.map(r =>
      `${r.id} | ${r.province} | ${r.city} | ${r.district} | ${r.birthDate} | ${r.gender} | ${r.age}岁`
    ).join('\n')
  }

  return results.value.map(r => r.id).join('\n')
})

// ===== 初始化 =====
generate()
</script>

<template>
  <ToolCard title="身份证号码生成器" description="在线随机身份证号码生成器，可指定省份、出生日期、性别批量生成模拟身份证号">

    <div class="space-y-6">

      <!-- ===== 配置选项 ===== -->
      <section>
        <h2 class="text-sm font-semibold text-content-secondary mb-3 flex items-center gap-1.5">
          <Settings2 class="h-4 w-4" />
          生成配置
        </h2>

        <div class="rounded-[12px] border border-line p-4 bg-surface-secondary space-y-4">

          <!-- 出生地 -->
          <div>
            <label class="label-text">出生地</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
              <CustomSelect
                v-model="selectedProvince"
                :options="[{ label: '随机省份', value: '' }, ...provinces.map(p => ({ label: p, value: p }))]"
              />
              <CustomSelect
                v-model="selectedCity"
                :options="[{ label: '随机城市', value: '' }, ...cities.map(c => ({ label: c, value: c }))]"
                :disabled="!selectedProvince"
              />
              <CustomSelect
                v-model="selectedDistrict"
                :options="[{ label: '随机区县', value: '' }, ...districts.map(d => ({ label: d, value: d }))]"
                :disabled="!selectedCity"
              />
            </div>
          </div>

          <!-- 出生日期 -->
          <div>
            <label class="label-text">出生日期</label>
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                @click="dateMode = 'random'"
                :class="[dateMode === 'random' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >随机</button>
              <button
                @click="dateMode = 'age-range'"
                :class="[dateMode === 'age-range' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >年龄范围</button>
              <button
                @click="dateMode = 'specific'"
                :class="[dateMode === 'specific' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >指定日期</button>
            </div>

            <!-- 年龄范围 -->
            <div v-if="dateMode === 'age-range'" class="flex items-center gap-2 mt-2">
              <input v-model.number="minAge" type="number" min="1" max="120" class="input-field !w-20 !py-1 font-mono text-sm" />
              <span class="text-xs text-content-tertiary">岁 ~</span>
              <input v-model.number="maxAge" type="number" min="1" max="120" class="input-field !w-20 !py-1 font-mono text-sm" />
              <span class="text-xs text-content-tertiary">岁</span>
            </div>

            <!-- 指定日期 -->
            <div v-if="dateMode === 'specific'" class="flex items-center gap-2 mt-2">
              <CustomSelect
                v-model="specificYear"
                :options="Array.from({length: 100}, (_, i) => ({ label: `${2026 - i}年`, value: 2026 - i }))"
              />
              <CustomSelect
                v-model="specificMonth"
                :options="Array.from({length: 12}, (_, i) => ({ label: `${i + 1}月`, value: i + 1 }))"
              />
              <CustomSelect
                v-model="specificDay"
                :options="Array.from({length: 31}, (_, i) => ({ label: `${i + 1}日`, value: i + 1 }))"
              />
            </div>
          </div>

          <!-- 性别 -->
          <div>
            <label class="label-text">性别</label>
            <div class="flex flex-wrap gap-2 mt-1">
              <button
                @click="genderOption = 'random'"
                :class="[genderOption === 'random' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >随机</button>
              <button
                @click="genderOption = 'male'"
                :class="[genderOption === 'male' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >男</button>
              <button
                @click="genderOption = 'female'"
                :class="[genderOption === 'female' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs']"
              >女</button>
            </div>
          </div>

          <!-- 数量与格式 -->
          <div class="flex flex-col sm:flex-row gap-4">
            <div>
              <label class="label-text">生成数量</label>
              <div class="flex items-center gap-2 mt-1">
                <input v-model.number="count" type="number" min="1" max="100" class="input-field !w-24 !py-1 font-mono text-sm" />
                <span class="text-xs text-content-tertiary">1 ~ 100</span>
              </div>
            </div>
            <div>
              <label class="label-text">输出格式</label>
              <div class="flex flex-wrap gap-2 mt-1">
                <button
                  @click="outputFormat = 'default'"
                  :class="[outputFormat === 'default' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs flex items-center gap-1']"
                >
                  <List class="h-3 w-3" />
                  默认
                </button>
                <button
                  @click="outputFormat = 'json'"
                  :class="[outputFormat === 'json' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs flex items-center gap-1']"
                >
                  <FileJson class="h-3 w-3" />
                  JSON
                </button>
                <button
                  @click="outputFormat = 'detailed'"
                  :class="[outputFormat === 'detailed' ? 'btn-primary' : 'btn-secondary', '!px-2.5 !py-1 text-xs flex items-center gap-1']"
                >
                  <Table class="h-3 w-3" />
                  详细信息
                </button>
              </div>
            </div>
          </div>

          <!-- 生成按钮 -->
          <div>
            <button @click="generate" class="btn-primary flex items-center gap-1.5">
              <RefreshCw class="h-4 w-4" />
              生成
            </button>
          </div>
        </div>
      </section>

      <!-- ===== 结果列表 ===== -->
      <section v-if="results.length > 0">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-content-secondary flex items-center gap-1.5">
            <Fingerprint class="h-4 w-4" />
            生成结果
            <span class="text-xs font-normal text-content-tertiary">
              (共 {{ stats.total }} 个，男 {{ stats.maleCount }} 个，女 {{ stats.femaleCount }} 个)
            </span>
          </h2>
          <CopyButton :text="outputText" label="复制全部" size="sm" />
        </div>

        <!-- JSON 格式 -->
        <div v-if="outputFormat === 'json'" class="rounded-[12px] border border-line overflow-hidden">
          <pre class="p-4 text-sm font-mono text-content-primary bg-surface-primary overflow-x-auto whitespace-pre-wrap break-all select-all">{{ outputText }}</pre>
        </div>

        <!-- 默认/详细 格式 -->
        <div v-else class="rounded-[12px] border border-line overflow-hidden divide-y divide-line">
          <div
            v-for="(item, index) in results"
            :key="index"
            class="flex items-center justify-between px-4 py-2.5 bg-surface-primary hover:bg-surface-secondary transition-colors"
          >
            <div class="min-w-0 flex-1">
              <span class="font-mono text-sm text-content-primary break-all select-all">
                {{ item.id }}
              </span>
              <span v-if="outputFormat === 'detailed'" class="block text-xs text-content-tertiary mt-0.5">
                {{ item.province }} {{ item.city }} {{ item.district }} | {{ item.birthDate }} | {{ item.gender }} | {{ item.age }}岁
              </span>
              <span v-else class="text-xs text-content-tertiary ml-2">
                {{ item.gender }} {{ item.age }}岁
              </span>
            </div>
            <CopyButton :text="item.id" label="" size="sm" />
          </div>
        </div>
      </section>

      <!-- ===== 空状态 ===== -->
      <div v-else class="text-center py-12 text-content-tertiary">
        <Fingerprint class="h-10 w-10 mx-auto mb-2 opacity-40" />
        <p class="text-sm">点击"生成"按钮创建身份证号码</p>
      </div>

      <!-- ===== 使用说明 ===== -->
      <div class="rounded-[12px] bg-surface-secondary border border-line p-4">
        <h3 class="text-xs font-semibold text-content-secondary mb-2">生成规则</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 18位身份证号码：6位地区码 + 8位出生日期 + 3位顺序码 + 1位校验码</li>
          <li>• 顺序码末位奇数为男性，偶数为女性</li>
          <li>• 校验码根据前17位按加权因子算法计算</li>
          <li>• 地区码使用真实行政区划代码</li>
        </ul>
        <h3 class="text-xs font-semibold text-content-secondary mt-3 mb-2">声明</h3>
        <ul class="text-xs text-content-tertiary space-y-1">
          <li>• 本工具生成的身份证号码为随机模拟数据，仅用于测试和开发用途</li>
          <li>• 生成的号码可能与真实号码重复，请勿用于非法用途</li>
        </ul>
      </div>

    </div>
  </ToolCard>
</template>
