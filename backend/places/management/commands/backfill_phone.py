from django.core.management.base import BaseCommand

from places.models import Place
from places.services import kakao_geocode_full


class Command(BaseCommand):
    help = (
        '이미 kakao_place_id가 있는(=name/address가 검증된) 장소들 중 phone이 '
        '비어있는 것들을, 같은 name/좌표로 다시 카카오에 검색해서(geo-bias 적용) '
        'phone만 채워넣는다. 매칭된 kakao_place_id가 기존과 다르면(불일치) 건너뛴다.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='지정하지 않으면 dry-run(조회만, DB 미반영). 지정하면 실제로 저장.',
        )

    def handle(self, *args, **options):
        apply_changes = options['apply']
        targets = (
            Place.objects.exclude(kakao_place_id__isnull=True)
            .exclude(kakao_place_id='')
            .filter(phone='')
            .order_by('id')
        )
        self.stdout.write(f'대상: {targets.count()}건 (' + ('실제 반영' if apply_changes else 'dry-run') + ')')

        filled, mismatched, no_match = 0, 0, 0
        for place in targets:
            lat = float(place.latitude) if place.latitude else None
            lng = float(place.longitude) if place.longitude else None
            if lat == 0 and lng == 0:
                lat = lng = None
            match = kakao_geocode_full(place.name, place.address, lat=lat, lng=lng)

            if not match or not match.get('phone'):
                no_match += 1
                continue
            if str(match.get('kakao_place_id')) != str(place.kakao_place_id):
                mismatched += 1
                self.stdout.write(
                    f'  [불일치, 건너뜀] {place.name!r} 기존 id={place.kakao_place_id} '
                    f'!= 재검색 id={match.get("kakao_place_id")}'
                )
                continue

            self.stdout.write(f'  [채움] {place.name!r} → phone={match["phone"]!r}')
            filled += 1
            if apply_changes:
                place.phone = match['phone']
                place.save(update_fields=['phone'])

        self.stdout.write(
            f'완료: 채움 {filled}건, id불일치(건너뜀) {mismatched}건, 매칭없음/전화없음 {no_match}건'
            + ('' if apply_changes else ' (dry-run — 실제 반영하려면 --apply)')
        )
