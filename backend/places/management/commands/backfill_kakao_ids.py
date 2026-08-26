from django.core.management.base import BaseCommand

from places.models import Place
from places.services import kakao_geocode_full, _address_matches


class Command(BaseCommand):
    help = (
        '관리자가 이미 name/address를 정확하게 바로잡아둔 장소들을 대상으로, '
        '그 값 그대로 카카오에 검색해서 kakao_place_id/kakao_place_url만 채워넣는다. '
        'name/address/좌표는 건드리지 않는다.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='지정하지 않으면 dry-run(조회만, DB 미반영). 지정하면 실제로 저장.',
        )

    def handle(self, *args, **options):
        apply_changes = options['apply']
        targets = (
            Place.objects.filter(kakao_place_id__isnull=True)
            | Place.objects.filter(kakao_place_id='')
        ).distinct().order_by('id')

        self.stdout.write(f'대상: {targets.count()}건 (' + ('실제 반영' if apply_changes else 'dry-run') + ')')

        filled, needs_review, no_match = 0, 0, 0
        for place in targets:
            lat = float(place.latitude) if place.latitude else None
            lng = float(place.longitude) if place.longitude else None
            if lat == 0 and lng == 0:
                lat = lng = None
            match = kakao_geocode_full(place.name, place.address, lat=lat, lng=lng)
            if not match or not match.get('kakao_place_id'):
                no_match += 1
                continue

            region_ok = _address_matches(match['address'], place.address)
            if not region_ok:
                needs_review += 1
                self.stdout.write(
                    f'  [검토 필요, 지역 불일치] {place.name!r} ({place.address!r}) → '
                    f'카카오 후보 {match["name"]!r} ({match["address"]!r}), id={match["kakao_place_id"]}'
                )
                continue

            self.stdout.write(f'  [채움] {place.name!r} → kakao_place_id={match["kakao_place_id"]}')
            filled += 1
            if apply_changes:
                place.kakao_place_id = match['kakao_place_id']
                place.kakao_place_url = match.get('kakao_place_url')
                place.save(update_fields=['kakao_place_id', 'kakao_place_url'])

        self.stdout.write(
            f'완료: 채움 {filled}건, 검토필요(미반영) {needs_review}건, 매칭없음 {no_match}건'
            + ('' if apply_changes else ' (dry-run — 실제 반영하려면 --apply)')
        )
