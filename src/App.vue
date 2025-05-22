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
            <option v-for="region in regions" :key="region" :value="region">
              {{ region }}
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
            <option v-for="city in filteredCities" :key="city" :value="city">
              {{ city }}
            </option>
          </select>
        </div>
        
        <div class="w-full md:w-auto flex items-end">
          <button 
            @click="getCurrentLocation" 
            class="w-full md:w-auto px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-colors"
            :disabled="isLoading"
          >
            <span v-if="isLoading" class="flex items-center">
              <LoaderIcon class="animate-spin h-4 w-4 mr-2" />
              로딩 중...
            </span>
            <span v-else>현재 위치로 이동</span>
          </button>
        </div>
      </div>
      
      <!-- 지도 영역 -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div id="map" ref="mapRef" class="w-full h-[50vh] relative">
          <!-- 로딩 오버레이 -->
          <div v-if="isLoading" class="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center z-10">
            <div class="bg-white p-4 rounded-lg shadow-lg flex items-center">
              <LoaderIcon class="animate-spin h-5 w-5 mr-2 text-primary" />
              <span>음식점 정보를 불러오는 중...</span>
            </div>
          </div>
        </div>
        
        <!-- 리스트 토글 버튼 -->
        <div class="p-2 bg-gray-100 border-t border-gray-200 flex justify-between items-center">
          <span class="text-sm text-gray-500 ml-4">
            {{ filteredRestaurants.length > 0 ? `${filteredRestaurants.length}개의 음식점 발견` : '음식점 정보 없음' }}
          </span>
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
          <div v-if="showRestaurantList" class="max-h-[50vh] overflow-y-auto">
            <div v-if="isLoading" class="p-8 text-center">
              <LoaderIcon class="animate-spin h-8 w-8 mx-auto mb-2 text-primary" />
              <p class="text-gray-500">음식점 정보를 불러오는 중...</p>
            </div>
            <div v-else-if="filteredRestaurants.length === 0" class="p-8 text-center text-gray-500">
              <UtensilsCrossedIcon class="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>이 지역에 등록된 맛집이 없습니다.</p>
              <p class="text-sm mt-2">다른 지역을 선택하거나 현재 위치를 변경해보세요.</p>
            </div>
            <ul v-else class="divide-y divide-gray-200">
              <li 
                v-for="(restaurant, index) in filteredRestaurants" 
                :key="restaurant.id" 
                class="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                @click="highlightMarker(index)"
                :class="{'bg-gray-100': selectedRestaurantIndex === index}"
              >
                <div class="flex items-start space-x-4">
                  <div class="flex-shrink-0">
                    <img 
                      :src="`/placeholder.svg?height=80&width=80&text=${restaurant.name}`" 
                      alt="음식점 이미지" 
                      class="w-20 h-20 object-cover rounded-md"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-lg font-medium text-gray-900 truncate">{{ restaurant.name }}</p>
                    <p class="text-sm text-gray-500 mt-1">{{ restaurant.address }}</p>
                    <div class="flex items-center mt-2 space-x-4">
                      <div class="flex items-center">
                        <MapPinIcon class="h-4 w-4 text-gray-400 mr-1" />
                        <span class="text-xs text-gray-500">{{ formatDistance(restaurant.distance) }}</span>
                      </div>
                      <div class="flex items-center">
                        <UtensilsIcon class="h-4 w-4 text-gray-400 mr-1" />
                        <span class="text-xs text-gray-500">{{ restaurant.type }}</span>
                      </div>
                    </div>
                    <div v-if="restaurant.main" class="mt-1 text-sm text-gray-600">
                      <span class="font-medium">대표 메뉴:</span> {{ restaurant.main }}
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
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  MapPinIcon, 
  UtensilsCrossedIcon, 
  UtensilsIcon, 
  LoaderIcon 
} from 'lucide-vue-next'

// 지도 관련 변수
const mapRef = ref(null)
const map = ref(null)
const markers = ref([])
const infoWindows = ref([])
const currentPosition = ref(null)
const defaultPosition = { lat: 37.5665, lng: 126.9780 } // 서울시 중심 좌표

// UI 상태 관련 변수
const showRestaurantList = ref(true)
const selectedRestaurantIndex = ref(null)
const isLoading = ref(false)

// 지역 및 도시 선택 관련 변수
const selectedRegion = ref('')
const selectedCity = ref('')

// 음식점 데이터
const restaurants = ref([])
const filteredRestaurants = computed(() => {
  let filtered = restaurants.value

  // 초기, 선택 지역이 없는 경우, 서울이나 현재 위치를 보여줌.
  console.log("지역 >", selectedRegion)
  console.log("동네>", selectedCity)
  if (!selectedRegion.value && !currentPosition) {
    console.log("기본 데이터를 불러옵니다...")
    filtered = filtered.filter(r => r.region === "서울특별시")
  }
  // 지역 필터링
  if (selectedRegion.value) {
    filtered = filtered.filter(r => r.region === selectedRegion.value)
  }
  
  // 도시 필터링
  if (selectedCity.value) {
    filtered = filtered.filter(r => r.city === selectedCity.value)
  }

  console.log("필터링된 데이터를 불러옵니다....")
  console.log(filtered.length)
  console.log("is loading>>>", isLoading.value)
  
  // 거리순 정렬
  return filtered.sort((a, b) => a.distance - b.distance)
})

// 지역 및 도시 목록 (API 데이터에서 추출)
const regions = computed(() => {
  console.log("전체 지역 및 도시목록 불러오기....")

  const uniqueRegions = [...new Set(restaurants.value.map(r => r.region))]

  return uniqueRegions.sort()
})
console.log("선택된 도시...")
console.log(selectedRegion.value)
const filteredCities = computed(() => {
  if (!selectedRegion.value) return []
  const cities = restaurants.value
    .filter(r => r.region === selectedRegion.value)
    .map(r => r.city)
  return [...new Set(cities)].sort()
})

// 지도 초기화 함수
const initMap = async () => {
  if (!window.google) {
    console.error('Google Maps API가 로드되지 않았습니다.')
    return
  }

  // DOM이 업데이트될 때까지 기다림
  await nextTick()
  
  // mapRef.value가 존재하는지 확인
  if (!mapRef.value) {
    console.error('지도를 표시할 DOM 요소를 찾을 수 없습니다.')
    // 잠시 후 다시 시도
    setTimeout(initMap, 500)
    return
  }

  try {
    console.log('지도 초기화 시작:', mapRef.value)
    map.value = new window.google.maps.Map(mapRef.value, {
      center: defaultPosition,
      zoom: 14,
      mapTypeControl: false,
      fullscreenControl: false,
      streetViewControl: false
    })
    
    console.log('지도 초기화 완료')

    // 현재 위치 가져오기 시도
    getCurrentLocation()
  } catch (error) {
    console.error('지도 초기화 중 오류 발생:', error)
  }
}

// 현재 위치 가져오기
const getCurrentLocation = () => {
  isLoading.value = true
  
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        currentPosition.value = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
        
        // 지도 중심 이동
        map.value.setCenter(currentPosition.value)
        
        // 현재 위치 마커 추가
        new window.google.maps.Marker({
          position: currentPosition.value,
          map: map.value,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#4285F4',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
          },
          title: '현재 위치'
        })
        
        // 음식점 데이터 로드 및 거리 계산
        loadRestaurantData()
      },
      (error) => {
        console.error('위치 정보를 가져오는데 실패했습니다:', error)
        // 기본 위치(서울)로 설정
        currentPosition.value = defaultPosition
        map.value.setCenter(defaultPosition)
        loadRestaurantData()
      }
    )
  } else {
    console.error('이 브라우저에서는 위치 정보를 지원하지 않습니다.')
    // 기본 위치(서울)로 설정
    currentPosition.value = defaultPosition
    map.value.setCenter(defaultPosition)
    loadRestaurantData()
  }
}

// 백엔드 API에서 음식점 데이터 로드
const loadRestaurantData = async () => {
  isLoading.value = true
  clearMarkers()
  console.log("API에서 음식점 데이터를 로드합니다...")
  try {
    // 프록시 설정을 통해 상대 경로 사용
    const response = await fetch('http://localhost:8080/api/data')
    if (!response.ok) {
      throw new Error('API 응답이 올바르지 않습니다.')
    }
    
    const data = await response.json()
    
    // 위도, 경도 데이터가 없는 경우를 대비한 예시 데이터
    // 실제로는 DB에서 위도, 경도 데이터를 함께 가져와야 합니다
    const processedData = data.map(restaurant => {

      // 가상의 위도, 경도 데이터 (만약 실제 데이터가 없는 경우, 서울)
      const latitude = restaurant.lat || 37.5665
      const longitude = restaurant.lng || 126.9780;
      // console.log("현재위치 --- > ", currentPosition.value.lat, currentPosition.value.lng,)
      // 현재 위치와의 거리 계산
      const distance = calculateDistance(
        currentPosition.value.lat,
        currentPosition.value.lng,
        latitude,
        longitude
      )
      
      return {
        ...restaurant,
        coordinates: {
          lat: latitude,
          lng: longitude
        },
        distance
      }
    })

    // 10km 이내의 음식점만 필터링
    restaurants.value = processedData.filter(r =>r.distance != null && r.distance <= 10)
    console.log("반경 10키로 이내의 데이터들")
    console.log(restaurants.value)
    // 마커 추가
    addMarkers()
    
  } catch (error) {
    console.error('음식점 데이터를 불러오는데 실패했습니다:', error)
  }   
}

// 마커 추가
const addMarkers = () => {
  // 기존 마커 제거
  clearMarkers()
  
  filteredRestaurants.value.forEach((restaurant, index) => {
    const marker = new window.google.maps.Marker({
      position: restaurant.coordinates,
      map: map.value,
      title: restaurant.name,
      animation: null
    })
    
    // 정보창 내용 생성
    const contentString = `
      <div class="p-3 max-w-xs">
        <div class="font-bold text-lg mb-1">${restaurant.name}</div>
        <div class="text-sm text-gray-600 mb-2">${restaurant.address}</div>
        <div class="text-sm text-gray-600 mb-1">종류: ${restaurant.type}</div>
        ${restaurant.main ? `<div class="text-sm text-gray-600 mb-1">대표 메뉴: ${restaurant.main}</div>` : ''}
        <div class="text-sm text-gray-600">거리: ${formatDistance(restaurant.distance)}</div>
      </div>
    `
    
    const infoWindow = new window.google.maps.InfoWindow({
      content: contentString,
      maxWidth: 300
    })
    
    marker.addListener('click', () => {
      // 다른 인포윈도우 닫기
      infoWindows.value.forEach(iw => iw.close())
      
      // 현재 인포윈도우 열기
      infoWindow.open(map.value, marker)
      
      // 리스트에서 해당 음식점 하이라이트
      selectedRestaurantIndex.value = index
      
      // 리스트가 숨겨져 있다면 보이게 함
      if (!showRestaurantList.value) {
        showRestaurantList.value = true
      }
    })
    
    markers.value.push(marker)
    infoWindows.value.push(infoWindow)
  })
}

// 마커 제거
const clearMarkers = () => {
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
  infoWindows.value = []
}

// 마커 하이라이트
const highlightMarker = (index) => {
  selectedRestaurantIndex.value = index
  
  // 모든 마커 애니메이션 초기화
  markers.value.forEach(marker => marker.setAnimation(null))
  
  // 선택된 마커 애니메이션 설정
  if (markers.value[index]) {
    // 지도 중심 이동
    map.value.panTo(markers.value[index].getPosition())
    
    // 마커 애니메이션
    markers.value[index].setAnimation(window.google.maps.Animation.BOUNCE)
    setTimeout(() => {
      markers.value[index].setAnimation(null)
    }, 1500)
    
    // 인포윈도우 열기
    infoWindows.value.forEach(iw => iw.close())
    infoWindows.value[index].open(map.value, markers.value[index])
  }
}

// 리스트 토글
const toggleRestaurantList = () => {
  showRestaurantList.value = !showRestaurantList.value
}

// 지역 변경 이벤트
const onRegionChange = () => {
  selectedCity.value = ''
  
  if (selectedRegion.value) {
    // 해당 지역의 첫 번째 음식점 위치로 이동
    const regionRestaurants = restaurants.value.filter(r => r.region === selectedRegion.value)
    if (regionRestaurants.length > 0) {
      map.value.setCenter(regionRestaurants[0].coordinates)
      map.value.setZoom(12)
    }
  }
  
  // 마커 업데이트
  addMarkers()
}

// 도시 변경 이벤트
const onCityChange = () => {
  if (selectedCity.value) {
    // 해당 도시의 첫 번째 음식점 위치로 이동
    const cityRestaurants = restaurants.value.filter(
      r => r.region === selectedRegion.value && r.city === selectedCity.value
    )
    if (cityRestaurants.length > 0) {
      map.value.setCenter(cityRestaurants[0].coordinates)
      map.value.setZoom(14)
    }
  }
  
  // 마커 업데이트
  addMarkers()
}

// 거리 계산 (Haversine 공식)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // 지구 반경 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  const distance = R * c

  return distance
}

// 거리 포맷팅
const formatDistance = (distance) => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`
  }
  return `${distance.toFixed(1)}km`
}

// 구글 맵 API 로드
const loadGoogleMapsApi = () => {
  // 이미 로드된 경우 중복 로드 방지
  if (window.google && window.google.maps) {
    console.log('Google Maps API가 이미 로드되어 있습니다.')
    initMap()
    return
  }

  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places&callback=initMapCallback`
  script.async = true
  script.defer = true
  
  // 콜백 함수 전역 설정
  window.initMapCallback = () => {
    console.log('Google Maps API 로드 완료')
    // 약간의 지연을 두고 초기화
    setTimeout(initMap, 100)
  }
  
  // 스크립트 로드 오류 처리
  script.onerror = () => {
    console.error('Google Maps API 로드 실패')
  }
  
  document.head.appendChild(script)
}

// 컴포넌트 마운트 시 구글 맵 API 로드
onMounted(async () => {
  console.log('컴포넌트 마운트됨')
  await loadRestaurantData();
  // DOM이 렌더링된 후 API 로드
  nextTick(() => {
    console.log('DOM 업데이트됨, API 로드 시작')
    loadGoogleMapsApi()
  })
})

// 필터링 변경 시 마커 업데이트
watch([selectedRegion, selectedCity], () => {
  filteredRestaurants;
  addMarkers()

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
  --color-primary: #4f46e5;
  --color-primary-dark: #4338ca;
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