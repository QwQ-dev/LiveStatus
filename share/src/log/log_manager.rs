use flexi_logger::{
    Age, Cleanup, Criterion, Duplicate, FlexiLoggerError, Logger, LoggerHandle, Naming,
};

const LOG_FILE_BASENAME: &str = "status_reporter";

pub fn setup_logging() -> Result<LoggerHandle, FlexiLoggerError> {
    Logger::try_with_str("info")?
        .format(log_format)
        .log_to_file(
            flexi_logger::FileSpec::default()
                .directory("logs")
                .basename(LOG_FILE_BASENAME),
        )
        .duplicate_to_stderr(Duplicate::Info)
        .append()
        .rotate(
            Criterion::Age(Age::Day),
            Naming::Timestamps,
            Cleanup::KeepLogFiles(7),
        )
        .start()
}

fn log_format(
    w: &mut dyn std::io::Write,
    now: &mut flexi_logger::DeferredNow,
    record: &log::Record,
) -> Result<(), std::io::Error> {
    write!(
        w,
        "[{}] [{}] {}",
        now.now().format("%Y-%m-%d %H:%M:%S"),
        record.level(),
        &record.args()
    )
}
