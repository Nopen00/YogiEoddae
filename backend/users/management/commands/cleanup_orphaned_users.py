from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from users.models import User


class Command(BaseCommand):
    help = '마지막 활동으로부터 2년이 지난 유저와 관련 데이터를 삭제한다.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='실제 삭제하지 않고 대상 유저 수만 출력한다.',
        )

    def handle(self, *args, **options):
        cutoff = timezone.now() - timedelta(days=365 * 2)
        orphaned = User.objects.filter(last_active_at__lt=cutoff)
        count = orphaned.count()

        if options['dry_run']:
            self.stdout.write(f'[dry-run] 삭제 대상 유저: {count}명')
            return

        orphaned.delete()
        self.stdout.write(self.style.SUCCESS(f'삭제 완료: {count}명'))
