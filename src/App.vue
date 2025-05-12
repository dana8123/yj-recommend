<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-white shadow-md p-4">
      <h1 class="text-2xl font-bold text-center text-gray-800">맛집 탐색기</h1>
    </header>
    
    <div class="container mx-auto p-4">
      <!-- 지역 및 도시 선택 -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-4 flex flex-wrap gap-4">
        <div class="w-full md:w-auto flex-1">
          <label for="region" class="block text-sm font-medium text-gray-700 mb-1">지역</label>
          <select 
            id="region" 
            v-model="selectedRegion" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            @change="onRegionChange"
          >
            <option value="">지역 선택</option>
            <option v-for="region in regions" :key="region.code" :value="region.code">
              {{ region.name }}
            </option>
          </select>
        </div>
        
        <div class="w-full md:w-auto flex-1">
          <label for="city" class="block text-sm font-medium text-gray-700 mb-1">도시</label>
          <select 
            id="city" 
            v-model="selectedCity" 
            class="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50"
            @change="onCityChange"
            :disabled="!selectedRegion"
          >
            <option value="">도시 선택</option>
            <option v-for="city in filteredCities" :key="city.code" :value="city.code">
              {{ city.name }}
            </option>
          </select>
        </div>
        
        <div class="w-full md:w-auto flex items-end">
          <button 
            @click="getCurrentLocation" 
            class="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
          >
            현재 위치로 이동
          </button>
        </div>
      </div>
      
      <!-- 지도 영역 -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div id="map" class="w-full h-[500px]"></div>
        
        <!-- 리스트 토글 버튼 -->
        <div class="p-2 bg-gray-100 border-t border-gray-200 flex justify-center">
          <button 
            @click="toggleRestaurantList" 
            class="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary focus:outline-none transition-colors"
          >
            <ChevronUpIcon v-if="showRestaurantList" class="h-5 w-5 mr-1" />
            <ChevronDownIcon v-else class="h-5 w-5 mr-1" />
            {{ showRestaurantList ? '리스트 숨기기' : '리스트 보기' }}
          </button>
        </div>
        
        <!-- 음식점 리스트 -->
        <transition name="slide">
          <div v-if="showRestaurantList" class="max-h-[400px] overflow-y-auto">
            <div v-if="restaurants.length === 0" class="p-8 text-center text-gray-500">
              <UtensilsCrossedIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>이 지역에 등록된 맛집이 없습니다.</p>
            </div>
            <ul v-else class="divide-y divide-gray-200">
              <li 
                v-for="(restaurant, index) in restaurants" 
                :key="index" 
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="highlightMarker(index)"
                :class="{'bg-gray-100': selectedRestaurantIndex === index}"
              >
                <div class="flex items-center space-x-4">
                  <div class="flex-shrink-0">
                    <img 
                      :src="restaurant.image || '/placeholder.svg?height=80&width=80'" 
                      alt="음식점 이미지" 
                      class="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-lg font-medium text-gray-900 truncate">{{ restaurant.name }}</p>
                    <p class="text-sm text-gray-500 truncate">{{ restaurant.address }}</p>
                    <div class="flex items-center mt-1">
                      <StarIcon class="h-4 w-4 text-yellow-400" />
                      <span class="text-sm text-gray-600 ml-1">{{ restaurant.rating || '평점 없음' }}</span>
                    </div>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronUpIcon, ChevronDownIcon, UtensilsCrossedIcon, StarIcon } from 'lucide-vue-next'

// 상태 관리
const map = ref(null)
const markers = ref([])
const infoWindows = ref([])
const restaurants = ref([])
const selectedRestaurantIndex = ref(null)
const showRestaurantList = ref(true)
const selectedRegion = ref('')
const selectedCity = ref('')
const currentLocation = ref(null)

// 지역 데이터 (예시)
const regions = ref([
  { code: 'seoul', name: '서울' },
  { code: 'gyeonggi', name: '경기도' },
  { code: 'busan', name: '부산' },
  // 추가 지역
])

const cities = ref({
  seoul: [
    { code: 'gangnam', name: '강남구', location: { lat: 37.4979, lng: 127.0276 } },
    { code: 'mapo', name: '마포구', location: { lat: 37.5665, lng: 126.9018 } },
    { code: 'jongno', name: '종로구', location: { lat: 37.5720, lng: 126.9794 } },
  ],
  gyeonggi: [
    { code: 'seongnam', name: '성남시', location: { lat: 37.4386, lng: 127.1378 } },
    { code: 'suwon', name: '수원시', location: { lat: 37.2636, lng: 127.0286 } },
  ],
  busan: [
    { code: 'haeundae', name: '해운대구', location: { lat: 35.1631, lng: 129.1637 } },
    { code: 'namgu', name: '남구', location: { lat: 35.1357, lng: 129.0845 } },
  ],
})

// 필터링된 도시 목록
const filteredCities = computed(() => {
  if (!selectedRegion.value) return []
  return cities.value[selectedRegion.value] || []
})

// 맛집 데이터 (예시)
const fetchRestaurants = (location) => {
  // 실제로는 API 호출을 통해 데이터를 가져옴
  // 여기서는 예시 데이터 사용
  const mockData = [
    {
      name: '맛있는 식당',
      address: '서울시 강남구 테헤란로 123',
      location: { lat: location.lat + 0.002, lng: location.lng + 0.003 },
      rating: 4.5,
      image: 'https://via.placeholder.com/80'
    },
    {
      name: '행복한 밥집',
      address: '서울시 강남구 역삼로 456',
      location: { lat: location.lat - 0.001, lng: location.lng + 0.002 },
      rating: 4.2,
      image: 'https://via.placeholder.com/80'
    },
    {
      name: '맛의 정원',
      address: '서울시 강남구 선릉로 789',
      location: { lat: location.lat + 0.003, lng: location.lng - 0.001 },
      rating: 4.7,
      image: 'https://via.placeholder.com/80'
    },
    {
      name: '푸드 파라다이스',
      address: '서울시 강남구 삼성로 101',
      location: { lat: location.lat - 0.002, lng: location.lng - 0.003 },
      rating: 4.0,
      image: 'https://via.placeholder.com/80'
    },
    {
      name: '미식가의 천국',
      address: '서울시 강남구 봉은사로 202',
      location: { lat: location.lat + 0.001, lng: location.lng - 0.002 },
      rating: 4.8,
      image: 'https://via.placeholder.com/80'
    }
  ]
  
  restaurants.value = mockData
  return mockData
}

// 지도 초기화
const initMap = (location) => {
  if (!window.google) {
    console.error('Google Maps API가 로드되지 않았습니다.')
    return
  }
  
  const mapOptions = {
    center: location,
    zoom: 14,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: true,
    zoomControl: true,
  }
  
  map.value = new window.google.maps.Map(document.getElementById('map'), mapOptions)
  
  // 맛집 데이터 가져오기 및 마커 표시
  const restaurantData = fetchRestaurants(location)
  displayMarkers(restaurantData)
}

// 마커 표시
const displayMarkers = (restaurantData) => {
  // 기존 마커 및 인포윈도우 제거
  clearMarkers()
  
  restaurantData.forEach((restaurant, index) => {
    const marker = new window.google.maps.Marker({
      position: restaurant.location,
      map: map.value,
      title: restaurant.name,
      animation: window.google.maps.Animation.DROP
    })
    
    const infoContent = `
      <div class="p-2 max-w-xs">
        <h3 class="font-bold text-base">${restaurant.name}</h3>
        <p class="text-sm text-gray-600">${restaurant.address}</p>
      </div>
    `
    
    const infoWindow = new window.google.maps.InfoWindow({
      content: infoContent
    })
    
    marker.addListener('click', () => {
      // 다른 인포윈도우 닫기
      infoWindows.value.forEach(info => info.close())
      
      // 현재 인포윈도우 열기
      infoWindow.open(map.value, marker)
      
      // 선택된 음식점 인덱스 업데이트
      selectedRestaurantIndex.value = index
    })
    
    markers.value.push(marker)
    infoWindows.value.push(infoWindow)
  })
}

// 마커 초기화
const clearMarkers = () => {
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
  infoWindows.value = []
}

// 마커 하이라이트
const highlightMarker = (index) => {
  selectedRestaurantIndex.value = index
  
  // 지도 중심 이동
  map.value.panTo(restaurants.value[index].location)
  
  // 인포윈도우 열기
  infoWindows.value.forEach(info => info.close())
  infoWindows.value[index].open(map.value, markers.value[index])
  
  // 마커 애니메이션
  markers.value.forEach(marker => marker.setAnimation(null))
  markers.value[index].setAnimation(window.google.maps.Animation.BOUNCE)
  
  // 애니메이션 1.5초 후 중지
  setTimeout(() => {
    markers.value[index].setAnimation(null)
  }, 1500)
}

// 리스트 토글
const toggleRestaurantList = () => {
  showRestaurantList.value = !showRestaurantList.value
}

// 지역 변경 이벤트
const onRegionChange = () => {
  selectedCity.value = ''
}

// 도시 변경 이벤트
const onCityChange = () => {
  if (!selectedCity.value) return
  
  const selectedCityData = filteredCities.value.find(city => city.code === selectedCity.value)
  if (selectedCityData) {
    moveToLocation(selectedCityData.location)
  }
}

// 위치 이동
const moveToLocation = (location) => {
  if (!map.value) return
  
  map.value.panTo(location)
  map.value.setZoom(14)
  
  // 맛집 데이터 가져오기 및 마커 표시
  const restaurantData = fetchRestaurants(location)
  displayMarkers(restaurantData)
}

// 현재 위치 가져오기
const getCurrentLocation = () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        currentLocation.value = location
        moveToLocation(location)
      },
      (error) => {
        console.error('현재 위치를 가져오는데 실패했습니다:', error)
        // 기본 위치로 서울 설정
        const defaultLocation = { lat: 37.5665, lng: 126.9780 } // 서울시청
        moveToLocation(defaultLocation)
      }
    )
  } else {
    console.error('이 브라우저는 위치 정보를 지원하지 않습니다.')
    // 기본 위치로 서울 설정
    const defaultLocation = { lat: 37.5665, lng: 126.9780 } // 서울시청
    moveToLocation(defaultLocation)
  }
}

// Google Maps API 로드
const loadGoogleMapsAPI = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    console.log(import.meta.env.VUE_APP_GOOGLEMAP_API)
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`
    script.async = true
    script.defer = true
    
    script.onload = resolve
    script.onerror = reject
    
    document.head.appendChild(script)
  })
}

// 컴포넌트 마운트 시 실행
onMounted(async () => {
  try {
    await loadGoogleMapsAPI()
    
    // 현재 위치 가져오기 시도
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          currentLocation.value = location
          initMap(location)
        },
        (error) => {
          console.error('현재 위치를 가져오는데 실패했습니다:', error)
          // 기본 위치로 서울 설정
          const defaultLocation = { lat: 37.5665, lng: 126.9780 } // 서울시청
          initMap(defaultLocation)
        }
      )
    } else {
      console.error('이 브라우저는 위치 정보를 지원하지 않습니다.')
      // 기본 위치로 서울 설정
      const defaultLocation = { lat: 37.5665, lng: 126.9780 } // 서울시청
      initMap(defaultLocation)
    }
  } catch (error) {
    console.error('Google Maps API 로드 실패:', error)
  }
})
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: max-height 0.3s ease-in-out;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  overflow: hidden;
}

:deep(.gm-style-iw-d) {
  overflow: hidden !important;
}

:deep(.gm-style-iw-c) {
  padding: 12px !important;
}

/* 기본 색상 변수 */
:root {
  --color-primary: #ff5a5f;
  --color-primary-dark: #e74c3c;
}

/* Tailwind 색상 클래스 */
.bg-primary {
  background-color: var(--color-primary);
}

.bg-primary-dark {
  background-color: var(--color-primary-dark);
}

.text-primary {
  color: var(--color-primary);
}

.hover\:bg-primary-dark:hover {
  background-color: var(--color-primary-dark);
}

.hover\:text-primary:hover {
  color: var(--color-primary);
}

.focus\:border-primary:focus {
  border-color: var(--color-primary);
}

.focus\:ring-primary:focus {
  --tw-ring-color: var(--color-primary);
}
</style>