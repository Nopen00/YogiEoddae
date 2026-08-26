from django.core.management.base import BaseCommand

from places.models import Place
from places.services import _kto_detail_intro, _extract_business_hours


class Command(BaseCommand):
    help = (
        '실제 KTO content_id를 가진(=yt_ 접두사가 아닌) 장소들의 business_hours를 '
        'KTO detailIntro2로 채운다. lazy 동기화(refresh_place_if_stale)를 기다리지 않고 '
        '지금 바로 한 번 채워넣기 위한 1회성 백필.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--apply', action='store_true',
            help='지정하지 않으면 dry-run(조회만, DB 미반영). 지정하면 실제로 저장.',
        )

    def handle(self, *args, **options):
        apply_changes = options['apply']
        targets = (
            Place.objects.exclude(content_id__startswith='yt_')
            .exclude(category='')
            .filter(business_hours='')
            .order_by('id')
        )
        self.stdout.write(f'대상: {targets.count()}건 (' + ('실제 반영' if apply_changes else 'dry-run') + ')')

        filled, no_data = 0, 0
        for place in targets:
            intro = _kto_detail_intro(place.content_id, place.category)
            hours = _extract_business_hours(place.category, intro) if intro else ''
            if not hours:
                no_data += 1
                continue

            self.stdout.write(f'  [채움] {place.name!r} → {hours!r}')
            filled += 1
            if apply_changes:
                place.business_hours = hours
                place.save(update_fields=['business_hours'])

        self.stdout.write(
            f'완료: 채움 {filled}건, 데이터없음 {no_data}건'
            + ('' if apply_changes else ' (dry-run — 실제 반영하려면 --apply)')
        )
